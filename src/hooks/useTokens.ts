'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useAtom } from 'jotai';
import { portfolioAtom, isLoadingTokensAtom } from '@/store';
import { useEffect, useMemo } from 'react';
import {
  fetchAllTokenData,
  fetchCurrentPricesFromAlchemy,
  fetch24hOldPricesFromAlchemy,
} from '@/services/alchemy';
import { fetchTokenIcons } from '@/services/coingecko';
import {
  buildTokensFromData,
  calculatePortfolioTotals,
  collectTokensForPricing,
} from '@/utils/token-processor';

export function useTokens() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [, setPortfolio] = useAtom(portfolioAtom);
  const [, setIsLoading] = useAtom(isLoadingTokensAtom);

  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useBalance(
    { address }
  );

  const { data: erc20Tokens, isLoading: isLoadingERC20Tokens } = useQuery({
    queryKey: ['alchemy-token-data', address, chainId],
    queryFn: () => fetchAllTokenData(address!, chainId),
    enabled: !!address && !!chainId,
    refetchInterval: 60000,
    staleTime: 10000,
  });

  const allTokenSymbols = useMemo(() => {
    return [
      ...(nativeBalance ? [nativeBalance.symbol] : []),
      ...(erc20Tokens?.map((t) => t.symbol) || []),
    ];
  }, [nativeBalance, erc20Tokens]);

  const { data: tokenIcons, isLoading: isLoadingIcons } = useQuery({
    queryKey: ['coingecko-icons', allTokenSymbols],
    queryFn: ({ signal }) => fetchTokenIcons(allTokenSymbols, signal),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: allTokenSymbols.length > 0,
  });

  const tokensForPricing = useMemo(() => {
    return collectTokensForPricing(nativeBalance, erc20Tokens);
  }, [nativeBalance, erc20Tokens]);

  const { data: currentPrices, isLoading: isLoadingPrices } = useQuery({
    queryKey: ['alchemy-prices', tokensForPricing, chainId],
    queryFn: ({ signal }) =>
      fetchCurrentPricesFromAlchemy(tokensForPricing, chainId, signal),
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
    enabled: tokensForPricing.length > 0 && !!chainId,
  });

  const { data: historicalPrices } = useQuery({
    queryKey: ['alchemy-24h-changes', tokensForPricing, chainId],
    queryFn: ({ signal }) =>
      fetch24hOldPricesFromAlchemy(tokensForPricing, chainId, signal),
    refetchInterval: 300000,
    refetchIntervalInBackground: false,
    enabled: tokensForPricing.length > 0 && !!chainId,
  });

  useEffect(() => {
    if (!address) {
      setPortfolio({
        totalValue: 0,
        totalChangePercent24h: 0,
        totalChangeValue24h: 0,
        tokens: [],
      });
      setIsLoading(false);
      return;
    }

    const isLoadingEssentialData =
      isLoadingNativeBalance ||
      isLoadingIcons ||
      isLoadingPrices ||
      isLoadingERC20Tokens;

    if (isLoadingEssentialData) {
      setIsLoading(true);
      return;
    }

    const tokens = buildTokensFromData(nativeBalance, erc20Tokens, {
      currentPrices: currentPrices || {},
      historicalPrices: historicalPrices || {},
      icons: tokenIcons || {},
    });

    const portfolio = calculatePortfolioTotals(tokens);
    setPortfolio(portfolio);
    setIsLoading(false);
  }, [
    address,
    chainId,
    nativeBalance,
    erc20Tokens,
    tokenIcons,
    currentPrices,
    historicalPrices,
    isLoadingNativeBalance,
    isLoadingIcons,
    isLoadingPrices,
    isLoadingERC20Tokens,
    setPortfolio,
    setIsLoading,
  ]);
}
