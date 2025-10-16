import { useQuery } from '@tanstack/react-query';
import { fetchMarketData, fetchTrendingData } from '@/services/coingecko';

export function useMarketData() {
  const marketQuery = useQuery({
    queryKey: ['market-data'],
    queryFn: ({ signal }) => fetchMarketData(signal),
    refetchInterval: 100000,
    staleTime: 10000,
  });

  const trendingQuery = useQuery({
    queryKey: ['trending-data'],
    queryFn: fetchTrendingData,
    refetchInterval: 300000,
  });

  return {
    marketData: marketQuery.data,
    refetchMarket: marketQuery.refetch,
    isRefetchingMarket: marketQuery.isRefetching,
    errorMarket: marketQuery.error,
    isLoadingMarket: marketQuery.isLoading,
    trendingData: trendingQuery.data,
    errorTrending: trendingQuery.error,
    isLoadingTrending: trendingQuery.isLoading,
  };
}
