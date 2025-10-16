export interface ProcessedToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  rawBalance: string;
  logoUrl?: string;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  price: number;
  value: number;
  change24hPercent: number;
  change24hValue: number;
  logoUrl?: string;
}

export interface Portfolio {
  totalValue: number;
  totalChangePercent24h: number;
  totalChangeValue24h: number;
  tokens: Token[];
}

export type TimePeriod = '1h' | '24h' | '7d' | '30d';

export interface PriceData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  image?: string;
  market_cap?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
}

export interface TrendingCoin {
  item: {
    id: string;
    symbol: string;
    name: string;
    price_btc: number;
    thumb: string;
    data: {
      price: number;
      price_change_percentage_24h?: {
        usd: number;
      };
    };
  };
}
