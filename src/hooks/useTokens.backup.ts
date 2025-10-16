'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useAtom } from 'jotai';
import { portfolioAtom, isLoadingTokensAtom } from '@/store';
import { Token } from '@/types';
import { useEffect, useMemo } from 'react';
import { formatUnits } from 'ethers';
import { Alchemy, Network } from 'alchemy-sdk';

const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL;
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const COIN_GECKO_API_URL = process.env.NEXT_PUBLIC_COIN_GECKO_API_URL;

// Cache for tokens that returned "Token not found" errors - don't refetch these
const tokenNotFoundCache = new Set<string>();

// Interface for processed token data
interface ProcessedToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  rawBalance: string;
  logoUrl?: string;
}

// Interface for CoinGecko response
interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

// Get Alchemy SDK instance for specific chain
function getAlchemyInstance(chainId: number): Alchemy | null {
  if (!ALCHEMY_API_KEY) {
    console.warn('Alchemy API key not found');
    return null;
  }

  const networkMap: { [key: number]: Network } = {
    1: Network.ETH_MAINNET,
    56: Network.BNB_MAINNET,
    8453: Network.BASE_MAINNET,
    11155111: Network.ETH_SEPOLIA,
  };

  const network = networkMap[chainId];
  if (!network) {
    console.warn(`Unsupported chain ID for Alchemy: ${chainId}`);
    return null;
  }

  return new Alchemy({
    apiKey: ALCHEMY_API_KEY,
    network,
  });
}

async function fetchAllTokenData(
  address: string,
  chainId: number
): Promise<ProcessedToken[]> {
  const alchemy = getAlchemyInstance(chainId);
  if (!alchemy) return [];

  try {
    // Use Alchemy SDK to get token balances
    const balances = await alchemy.core.getTokenBalances(address);

    if (balances.tokenBalances.length === 0) return [];

    // Fetch metadata for all tokens in parallel
    const metadataPromises = balances.tokenBalances.map((token) =>
      alchemy.core.getTokenMetadata(token.contractAddress)
    );

    const metadataResults = await Promise.all(metadataPromises);
    // Process tokens
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
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Alchemy token data fetch was aborted');
      return [];
    }
    console.error('Error fetching token data from Alchemy:', error);
    return [];
  }
}

async function fetchTokenDataFromCoinGecko(
  tokenSymbols: string[],
  signal?: AbortSignal
): Promise<{
  [symbol: string]: { price: number; change24h: number; logo: string };
}> {
  if (tokenSymbols.length === 0) return {};
  if (!COIN_GECKO_API_URL) {
    console.warn('CoinGecko API URL not configured');
    return {};
  }

  try {
    const params = new URLSearchParams({
      vs_currency: 'usd',
      symbols: tokenSymbols.join(','),
      sparkline: 'false',
      price_change_percentage: '24h',
    });

    const response = await fetch(
      `${COIN_GECKO_API_URL}/coins/markets?${params.toString()}`,
      { signal }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoToken[] = await response.json();

    const tokenMap: {
      [symbol: string]: { price: number; change24h: number; logo: string };
    } = {};

    data.forEach((coin) => {
      tokenMap[coin.symbol.toUpperCase()] = {
        price: 0, // Will be replaced by address-based pricing
        change24h: 0, // Will be replaced by address-based pricing
        logo: coin.image || '',
      };
    });

    return tokenMap;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('CoinGecko fetch was aborted');
      return {};
    }
    console.error('Error fetching token data from CoinGecko:', error);
    return {};
  }
}

// Fetch current prices from Alchemy
// Native: https://api.g.alchemy.com/prices/v1/:apiKey/tokens/by-symbol
// ERC-20: https://api.g.alchemy.com/prices/v1/:apiKey/tokens/by-address
async function fetchCurrentPricesFromAlchemy(
  tokens: Array<{ address: string; symbol?: string }>,
  chainId: number,
  signal?: AbortSignal
): Promise<{
  [address: string]: number;
}> {
  if (tokens.length === 0) return {};
  if (!ALCHEMY_API_URL) {
    console.warn('Alchemy API key not found');
    return {};
  }

  // Map chain IDs to Alchemy network identifiers
  const networkMap: { [key: number]: string } = {
    1: 'eth-mainnet',
    56: 'bnb-mainnet',
    8453: 'base-mainnet',
    11155111: 'eth-sepolia',
  };

  const network = networkMap[chainId];
  if (!network) {
    console.warn(`Unsupported chain ID for Alchemy: ${chainId}`);
    return {};
  }

  try {
    const priceMap: { [address: string]: number } = {};

    // Separate native and ERC-20 tokens
    const nativeToken = tokens.find(
      (t) => t.address === '0x0000000000000000000000000000000000000000'
    );
    const erc20Tokens = tokens.filter(
      (t) => t.address !== '0x0000000000000000000000000000000000000000'
    );

    // Fetch native token price by symbol if present
    if (nativeToken && nativeToken.symbol) {
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
        console.log('result', result);
        if (result.data && result.data[0]) {
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

    // Fetch ERC-20 token prices by address
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
    console.log('priceMap', priceMap);
    return priceMap;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Alchemy price fetch was aborted');
      return {};
    }
    console.error('Error fetching prices from Alchemy:', error);
    return {};
  }
}

// Fetch historical prices and calculate 24h change
// https://api.g.alchemy.com/prices/v1/:apiKey/tokens/historical
async function fetch24hOldPricesFromAlchemy(
  tokens: Array<{ address: string; symbol?: string }>,
  chainId: number,
  signal?: AbortSignal
): Promise<{
  [address: string]: number;
}> {
  if (tokens.length === 0) return {};
  if (!ALCHEMY_API_KEY) {
    console.warn('Alchemy API key not found');
    return {};
  }

  // Map chain IDs to Alchemy network identifiers
  const networkMap: { [key: number]: string } = {
    1: 'eth-mainnet',
    56: 'bnb-mainnet',
    8453: 'base-mainnet',
    11155111: 'eth-sepolia',
  };

  const network = networkMap[chainId];
  if (!network) {
    console.warn(`Unsupported chain ID for Alchemy: ${chainId}`);
    return {};
  }

  try {
    const historicalPrice: { [address: string]: number } = {};

    // Calculate time range for 24h ago
    const endTime = new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString();
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch historical data for each token
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const isNativeToken =
        token.address === '0x0000000000000000000000000000000000000000';
      const cacheKey = isNativeToken
        ? token.symbol || token.address
        : token.address;

      // Skip if token was previously not found
      if (tokenNotFoundCache.has(cacheKey.toLowerCase())) {
        console.log(
          `Skipping ${cacheKey} - previously returned "Token not found"`
        );
        continue;
      }

      try {
        // Build request body - use symbol for native tokens, address+network for ERC-20
        let requestBody:
          | {
              symbol: string;
              startTime: string;
              endTime: string;
              interval: string;
            }
          | {
              network: string;
              address: string;
              startTime: string;
              endTime: string;
              interval: string;
            };

        if (isNativeToken && token.symbol) {
          // Native token - use symbol only (no network needed)
          requestBody = {
            symbol: token.symbol,
            startTime,
            endTime,
            interval: '5m',
          };
        } else {
          // ERC-20 token - use address + network
          requestBody = {
            network,
            address: token.address.toLowerCase(),
            startTime,
            endTime,
            interval: '5m',
          };
        }

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

        // Check if error message indicates token not found
        if (result.error?.message?.startsWith('Token not found:')) {
          console.warn(`Token not found: ${cacheKey} - will not refetch`);
          tokenNotFoundCache.add(cacheKey.toLowerCase());
          continue;
        }

        if (result.data[0]) {
          const prices = result.data[0].value;

          historicalPrice[token.address.toLowerCase()] = prices;
        }
      } catch (error) {
        console.warn(`Failed to fetch 24h change for ${token.address}:`, error);
        continue;
      }
    }
    console.log('changeMap', historicalPrice);
    return historicalPrice;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Alchemy 24h change fetch was aborted');
      return {};
    }
    console.error('Error fetching 24h changes from Alchemy:', error);
    return {};
  }
}

export function useTokens() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [, setPortfolio] = useAtom(portfolioAtom);
  const [, setIsLoading] = useAtom(isLoadingTokensAtom);

  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useBalance(
    {
      address,
    }
  );

  const { data: alchemyTokenData, isLoading: isLoadingAlchemyData } = useQuery({
    queryKey: ['alchemy-token-data', address, chainId],
    queryFn: () => fetchAllTokenData(address!, chainId),
    enabled: !!address && !!chainId,
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 10000, // 10 seconds
  });

  // Collect all token symbols for CoinGecko icons
  const allTokenSymbols = useMemo(() => {
    return [
      ...(nativeBalance ? [nativeBalance.symbol] : []),
      ...(alchemyTokenData?.map((t) => t.symbol) || []),
    ];
  }, [nativeBalance, alchemyTokenData]);

  // Fetch icons from CoinGecko (by symbol) - cache permanently, icons never change
  const { data: coinGeckoIcons, isLoading: isLoadingIcons } = useQuery({
    queryKey: ['coingecko-icons', allTokenSymbols],
    queryFn: ({ signal }) =>
      fetchTokenDataFromCoinGecko(allTokenSymbols, signal),
    staleTime: Infinity, // Never consider data stale
    gcTime: Infinity, // Keep in cache forever
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: allTokenSymbols.length > 0,
  });
  console.log('nativeBalance', nativeBalance);
  console.log('alchemyTokenData', alchemyTokenData);

  // Collect all tokens (address + symbol) for price fetching
  const allTokensWithSymbols = useMemo(() => {
    const tokens: Array<{ address: string; symbol?: string }> = [];

    // Add native token if present
    if (nativeBalance && parseFloat(nativeBalance.formatted) > 0) {
      tokens.push({
        address: '0x0000000000000000000000000000000000000000',
        symbol: nativeBalance.symbol,
      });
    }

    // Add ERC-20 tokens
    if (alchemyTokenData) {
      alchemyTokenData.forEach((t) => {
        tokens.push({
          address: t.address.toLowerCase(),
          symbol: t.symbol,
        });
      });
    }

    return tokens;
  }, [nativeBalance, alchemyTokenData]);

  // Fetch current prices from Alchemy
  const { data: alchemyPrices, isLoading: isLoadingPrices } = useQuery({
    queryKey: ['alchemy-prices', allTokensWithSymbols, chainId],
    queryFn: ({ signal }) =>
      fetchCurrentPricesFromAlchemy(allTokensWithSymbols, chainId, signal),
    refetchInterval: 60000, // Refetch every 60 seconds
    refetchIntervalInBackground: true,
    enabled: allTokensWithSymbols.length > 0 && !!chainId,
  });

  // Fetch 24h changes from Alchemy historical data (slower, sequential)
  // This runs independently and doesn't block initial render
  const { data: alchemy24hChanges } = useQuery({
    queryKey: ['alchemy-24h-changes', allTokensWithSymbols, chainId],
    queryFn: ({ signal }) =>
      fetch24hOldPricesFromAlchemy(allTokensWithSymbols, chainId, signal),
    refetchInterval: 300000, // Refetch every 5 minutes (less frequent, as it's slower)
    refetchIntervalInBackground: false,
    enabled: allTokensWithSymbols.length > 0 && !!chainId,
  });

  // Effect 1: Render page quickly with prices (without waiting for historical data)
  useEffect(() => {
    if (!address) {
      // Reset portfolio when wallet is disconnected
      setPortfolio({
        totalValue: 0,
        totalChangePercent24h: 0,
        totalChangeValue24h: 0,
        tokens: [],
      });
      setIsLoading(false);
      return;
    }

    // Only wait for essential data: balances, icons, and current prices
    if (
      isLoadingNativeBalance ||
      isLoadingIcons ||
      isLoadingPrices ||
      isLoadingAlchemyData
    ) {
      setIsLoading(true);
      return;
    }

    // Create tokens array with real wallet balances (without 24h change data initially)
    const tokens: Token[] = [];

    // Add native token (ETH/BNB/etc) if balance > 0
    if (nativeBalance && parseFloat(nativeBalance.formatted) > 0) {
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      // Get price from Alchemy (using zero address as key)
      const tokenPrice = alchemyPrices?.[zeroAddress] || 0;
      const historicalPrice = alchemy24hChanges?.[zeroAddress] || 0;
      // Get icon from CoinGecko (cached)
      const iconData = coinGeckoIcons?.[nativeBalance.symbol];
      const tokenValue = parseFloat(nativeBalance.formatted) * tokenPrice;

      // Calculate change if historical data is available, otherwise set to 0
      const change24hPercent =
        historicalPrice > 0
          ? ((tokenPrice - historicalPrice) / historicalPrice) * 100
          : 0;
      const change24hValue =
        historicalPrice > 0 ? tokenPrice - historicalPrice : 0;

      tokens.push({
        address: zeroAddress,
        symbol: nativeBalance.symbol,
        name: nativeBalance.symbol,
        decimals: nativeBalance.decimals,
        balance: nativeBalance.formatted,
        price: tokenPrice,
        value: tokenValue,
        change24hPercent,
        change24hValue,
        logoUrl: iconData?.logo || undefined,
      });
    }

    // Add ERC-20 tokens with their actual balances from Alchemy
    if (alchemyTokenData) {
      for (const tokenData of alchemyTokenData) {
        const tokenAddress = tokenData.address.toLowerCase();
        // Get price from Alchemy
        const tokenPrice = alchemyPrices?.[tokenAddress] || 0;
        // Get 24h change from Alchemy historical data (if available)
        const historicalPrice = alchemy24hChanges?.[tokenAddress] || 0;
        // Get icon from CoinGecko (cached)
        const iconData = coinGeckoIcons?.[tokenData.symbol];
        const tokenValue = parseFloat(tokenData.balance) * tokenPrice;

        // Calculate change if historical data is available, otherwise set to 0
        const change24hPercent =
          historicalPrice > 0
            ? ((tokenPrice - historicalPrice) / historicalPrice) * 100
            : 0;
        const change24hValue =
          historicalPrice > 0 ? tokenPrice - historicalPrice : 0;

        tokens.push({
          address: tokenData.address,
          symbol: tokenData.symbol,
          name: tokenData.name,
          decimals: tokenData.decimals,
          balance: tokenData.balance,
          price: tokenPrice,
          value: tokenValue,
          change24hPercent,
          change24hValue,
          logoUrl: iconData?.logo || tokenData.logoUrl || undefined,
        });
      }
    }

    // Calculate portfolio totals
    const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
    const totalChangePercent24h =
      tokens.length > 0
        ? tokens.reduce((sum, token) => sum + token.change24hPercent, 0) /
          tokens.length
        : 0;
    const totalChangeValue24h =
      tokens.length > 0
        ? tokens.reduce((sum, token) => sum + token.change24hValue, 0)
        : 0;

    const sortedTokens = tokens.sort((a, b) => b.value - a.value);
    setPortfolio({
      totalValue,
      totalChangePercent24h,
      totalChangeValue24h,
      tokens: sortedTokens,
    });

    setIsLoading(false);
  }, [
    address,
    chainId,
    nativeBalance,
    alchemyTokenData,
    coinGeckoIcons,
    alchemyPrices,
    alchemy24hChanges, // Include this so it updates when historical data arrives
    isLoadingNativeBalance,
    isLoadingIcons,
    isLoadingPrices,
    isLoadingAlchemyData,
    setPortfolio,
    setIsLoading,
  ]);
}
