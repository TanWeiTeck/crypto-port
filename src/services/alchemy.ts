import { Alchemy, Network } from 'alchemy-sdk';
import { formatUnits } from 'ethers';
import { ProcessedToken } from '@/types';

const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL;
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const tokenNotFoundCache = new Set<string>();

const NETWORK_MAP: { [key: number]: Network } = {
  1: Network.ETH_MAINNET,
  56: Network.BNB_MAINNET,
  8453: Network.BASE_MAINNET,
  11155111: Network.ETH_SEPOLIA,
};

const ALCHEMY_NETWORK_MAP: { [key: number]: string } = {
  1: 'eth-mainnet',
  56: 'bnb-mainnet',
  8453: 'base-mainnet',
  11155111: 'eth-sepolia',
};

function getAlchemyInstance(chainId: number): Alchemy | null {
  if (!ALCHEMY_API_KEY) {
    console.warn('Alchemy API key not found');
    return null;
  }

  const network = NETWORK_MAP[chainId];
  if (!network) {
    console.warn(`Unsupported chain ID: ${chainId}`);
    return null;
  }

  return new Alchemy({
    apiKey: ALCHEMY_API_KEY,
    network,
  });
}

export async function fetchAllTokenData(
  address: string,
  chainId: number
): Promise<ProcessedToken[]> {
  const alchemy = getAlchemyInstance(chainId);
  if (!alchemy) return [];

  try {
    const balances = await alchemy.core.getTokenBalances(address);
    if (balances.tokenBalances.length === 0) return [];

    const metadataPromises = balances.tokenBalances.map((token) =>
      alchemy.core.getTokenMetadata(token.contractAddress)
    );

    const metadataResults = await Promise.all(metadataPromises);

    const processedTokens: ProcessedToken[] = balances.tokenBalances
      .map((token, index) => {
        const meta = metadataResults[index];
        const decimals = meta?.decimals || 18;
        const rawBalance = token.tokenBalance || '0';
        const decodedBalance = formatUnits(rawBalance, decimals);

        return {
          address: token.contractAddress,
          symbol: meta?.symbol || `Token-${token.contractAddress.slice(0, 6)}`,
          name: meta?.name || 'Unknown Token',
          decimals,
          balance: decodedBalance,
          rawBalance,
        };
      })
      .filter((token) => parseFloat(token.balance) > 0);

    return processedTokens;
  } catch (error) {
    console.error('Error fetching token data from Alchemy:', error);
    throw error;
  }
}

export async function fetchCurrentPricesFromAlchemy(
  tokens: Array<{ address: string; symbol?: string }>,
  chainId: number,
  signal?: AbortSignal
): Promise<{ [address: string]: number }> {
  if (tokens.length === 0 || !ALCHEMY_API_URL) return {};

  const network = ALCHEMY_NETWORK_MAP[chainId];
  if (!network) {
    console.warn(`Unsupported chain ID: ${chainId}`);
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  try {
    const priceMap: { [address: string]: number } = {};

    const nativeToken = tokens.find(
      (t) => t.address === '0x0000000000000000000000000000000000000000'
    );
    const erc20Tokens = tokens.filter(
      (t) => t.address !== '0x0000000000000000000000000000000000000000'
    );

    if (nativeToken?.symbol) {
      const params = new URLSearchParams({
        symbols: nativeToken.symbol,
      });
      const response = await fetch(
        `${ALCHEMY_API_URL}/prices/v1/${ALCHEMY_API_KEY}/tokens/by-symbol?${params.toString()}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal,
        }
      );

      if (response.ok) {
        const result: {
          data: Array<{
            symbol: string;
            error?: string;
            prices?: Array<{ currency: string; value: string }>;
          }>;
        } = await response.json();

        if (result.data?.[0]) {
          const usdPrice = result.data[0].prices?.find(
            (p) => p.currency === 'usd'
          );
          if (usdPrice) {
            priceMap['0x0000000000000000000000000000000000000000'] =
              parseFloat(usdPrice.value) || 0;
          }
        }
      }
    }

    if (erc20Tokens.length > 0) {
      const addresses = erc20Tokens.map((token) => ({
        network,
        address: token.address.toLowerCase(),
      }));

      const response = await fetch(
        `${ALCHEMY_API_URL}/prices/v1/${ALCHEMY_API_KEY}/tokens/by-address`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addresses }),
          signal,
        }
      );

      if (response.ok) {
        const result: {
          data: Array<{
            address: string;
            error?: string;
            prices?: Array<{ currency: string; value: string }>;
          }>;
        } = await response.json();

        if (result.data) {
          result.data.forEach((token) => {
            if (token.error) {
              console.warn(`Price error for ${token.address}:`, token.error);
              return;
            }

            const usdPrice = token.prices?.find((p) => p.currency === 'usd');
            if (usdPrice) {
              priceMap[token.address.toLowerCase()] =
                parseFloat(usdPrice.value) || 0;
            }
          });
        }
      }
    }

    return priceMap;
  } catch (error) {
    console.error('Error fetching prices from Alchemy:', error);
    throw error;
  }
}

export async function fetch24hOldPricesFromAlchemy(
  tokens: Array<{ address: string; symbol?: string }>,
  chainId: number,
  signal?: AbortSignal
): Promise<{ [address: string]: number }> {
  if (tokens.length === 0 || !ALCHEMY_API_KEY) return {};

  const network = ALCHEMY_NETWORK_MAP[chainId];
  if (!network) {
    console.warn(`Unsupported chain ID: ${chainId}`);
    return {};
  }

  try {
    const historicalPrice: { [address: string]: number } = {};

    const endTime = new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString();
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    for (const token of tokens) {
      const isNativeToken =
        token.address === '0x0000000000000000000000000000000000000000';
      const cacheKey = isNativeToken
        ? token.symbol || token.address
        : token.address;

      if (tokenNotFoundCache.has(cacheKey.toLowerCase())) {
        console.log(
          `Skipping ${cacheKey} - previously returned "Token not found"`
        );
        continue;
      }

      try {
        const requestBody =
          isNativeToken && token.symbol
            ? {
                symbol: token.symbol,
                startTime,
                endTime,
                interval: '5m',
              }
            : {
                network,
                address: token.address.toLowerCase(),
                startTime,
                endTime,
                interval: '5m',
              };

        const response = await fetch(
          `${ALCHEMY_API_URL}/prices/v1/${ALCHEMY_API_KEY}/tokens/historical`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal,
          }
        );

        if (!response.ok) {
          console.warn(
            `Historical price error for ${token.address}:`,
            response.status
          );
          continue;
        }

        const result = await response.json();

        if (result.error?.message?.startsWith('Token not found:')) {
          console.warn(`Token not found: ${cacheKey} - will not refetch`);
          tokenNotFoundCache.add(cacheKey.toLowerCase());
          continue;
        }

        if (result.data?.[0]) {
          historicalPrice[token.address.toLowerCase()] = result.data[0].value;
        }
      } catch (error) {
        console.warn(`Failed to fetch 24h change for ${token.address}:`, error);
        continue;
      }
    }

    return historicalPrice;
  } catch (error) {
    console.error('Error fetching 24h changes from Alchemy:', error);
    throw error;
  }
}
