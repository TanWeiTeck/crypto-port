import { Token, ProcessedToken, Portfolio } from '@/types';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

interface NativeBalance {
  symbol: string;
  formatted: string;
  decimals: number;
}

interface TokenPriceData {
  currentPrices: { [address: string]: number };
  historicalPrices: { [address: string]: number };
  icons: { [symbol: string]: { logo: string } };
}

function calculatePriceChange(
  currentPrice: number,
  historicalPrice: number
): { changePercent: number; changeValue: number } {
  if (historicalPrice <= 0) {
    return { changePercent: 0, changeValue: 0 };
  }

  const changePercent =
    ((currentPrice - historicalPrice) / historicalPrice) * 100;
  const changeValue = currentPrice - historicalPrice;

  return { changePercent, changeValue };
}

function buildNativeToken(
  nativeBalance: NativeBalance,
  priceData: TokenPriceData
): Token | null {
  const balance = parseFloat(nativeBalance.formatted);
  if (balance <= 0) return null;

  const tokenPrice = priceData.currentPrices[ZERO_ADDRESS] || 0;
  const historicalPrice = priceData.historicalPrices[ZERO_ADDRESS] || 0;
  const iconData = priceData.icons[nativeBalance.symbol];
  const tokenValue = balance * tokenPrice;

  const { changePercent, changeValue } = calculatePriceChange(
    tokenPrice,
    historicalPrice
  );

  return {
    address: ZERO_ADDRESS,
    symbol: nativeBalance.symbol,
    name: nativeBalance.symbol,
    decimals: nativeBalance.decimals,
    balance: nativeBalance.formatted,
    price: tokenPrice,
    value: tokenValue,
    change24hPercent: changePercent,
    change24hValue: changeValue,
    logoUrl: iconData?.logo,
  };
}

function buildERC20Token(
  tokenData: ProcessedToken,
  priceData: TokenPriceData
): Token {
  const tokenAddress = tokenData.address.toLowerCase();
  const tokenPrice = priceData.currentPrices[tokenAddress] || 0;
  const historicalPrice = priceData.historicalPrices[tokenAddress] || 0;
  const iconData = priceData.icons[tokenData.symbol];
  const tokenValue = parseFloat(tokenData.balance) * tokenPrice;

  const { changePercent, changeValue } = calculatePriceChange(
    tokenPrice,
    historicalPrice
  );

  return {
    address: tokenData.address,
    symbol: tokenData.symbol,
    name: tokenData.name,
    decimals: tokenData.decimals,
    balance: tokenData.balance,
    price: tokenPrice,
    value: tokenValue,
    change24hPercent: changePercent,
    change24hValue: changeValue,
    logoUrl: iconData?.logo || tokenData.logoUrl,
  };
}

export function buildTokensFromData(
  nativeBalance: NativeBalance | undefined,
  erc20Tokens: ProcessedToken[] | undefined,
  priceData: TokenPriceData
): Token[] {
  const tokens: Token[] = [];

  if (nativeBalance) {
    const nativeToken = buildNativeToken(nativeBalance, priceData);
    if (nativeToken) tokens.push(nativeToken);
  }

  if (erc20Tokens) {
    for (const tokenData of erc20Tokens) {
      tokens.push(buildERC20Token(tokenData, priceData));
    }
  }

  return tokens.sort((a, b) => b.value - a.value);
}

export function calculatePortfolioTotals(tokens: Token[]): Portfolio {
  if (tokens.length === 0) {
    return {
      totalValue: 0,
      totalChangePercent24h: 0,
      totalChangeValue24h: 0,
      tokens: [],
    };
  }

  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
  const totalChangePercent24h =
    tokens.reduce((sum, token) => sum + token.change24hPercent, 0) /
    tokens.length;
  const totalChangeValue24h = tokens.reduce(
    (sum, token) => sum + token.change24hValue,
    0
  );

  return {
    totalValue,
    totalChangePercent24h,
    totalChangeValue24h,
    tokens,
  };
}

export function collectTokensForPricing(
  nativeBalance: NativeBalance | undefined,
  erc20Tokens: ProcessedToken[] | undefined
): Array<{ address: string; symbol?: string }> {
  const tokens: Array<{ address: string; symbol?: string }> = [];

  if (nativeBalance && parseFloat(nativeBalance.formatted) > 0) {
    tokens.push({
      address: ZERO_ADDRESS,
      symbol: nativeBalance.symbol,
    });
  }

  if (erc20Tokens) {
    erc20Tokens.forEach((t) => {
      tokens.push({
        address: t.address.toLowerCase(),
        symbol: t.symbol,
      });
    });
  }

  return tokens;
}
