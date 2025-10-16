import { atom } from 'jotai';
import { Portfolio } from '@/types';

export const portfolioAtom = atom<Portfolio>({
  totalValue: 0,
  totalChangePercent24h: 0,
  totalChangeValue24h: 0,
  tokens: [],
});

export const portfolioValueMaskAtom = atom<boolean>(false);

export const isLoadingTokensAtom = atom(false);
export const isLoadingPricesAtom = atom(false);
