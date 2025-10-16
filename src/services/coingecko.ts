import { PriceData, TrendingCoin } from '@/types';

const COIN_GECKO_API_URL = process.env.NEXT_PUBLIC_COIN_GECKO_API_URL;

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export async function fetchTokenIcons(
  tokenSymbols: string[],
  signal?: AbortSignal
): Promise<{ [symbol: string]: { logo: string } }> {
  if (tokenSymbols.length === 0) return {};

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

    const iconMap: { [symbol: string]: { logo: string } } = {};

    data.forEach((coin) => {
      iconMap[coin.symbol.toUpperCase()] = {
        logo: coin.image || '',
      };
    });

    return iconMap;
  } catch (error) {
    console.error('Error fetching token icons from CoinGecko:', error);
    throw error;
  }
}

export async function fetchMarketData(
  signal?: AbortSignal
): Promise<PriceData[]> {
  try {
    const params = new URLSearchParams({
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: '20',
      page: '1',
      sparkline: 'false',
      price_change_percentage: '1h,24h,7d,30d',
    });

    const response = await fetch(
      `${COIN_GECKO_API_URL}/coins/markets?${params.toString()}`,
      { signal }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching market data from CoinGecko:', error);
    throw error;
  }
}

export async function fetchTrendingData(): Promise<PriceData[]> {
  try {
    const response = await fetch(`${COIN_GECKO_API_URL}/search/trending`);

    if (!response.ok) {
      throw new Error('Failed to fetch trending data');
    }

    const data = await response.json();
    return data.coins.map((coin: TrendingCoin) => ({
      id: coin.item.id,
      symbol: coin.item.symbol,
      name: coin.item.name,
      current_price: coin.item.data.price,
      price_change_percentage_24h:
        coin.item.data?.price_change_percentage_24h?.usd || 0,
      image: coin.item.thumb,
    }));
  } catch (error) {
    console.error('Error fetching trending data from CoinGecko:', error);
    throw error;
  }
}
