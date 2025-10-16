'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCcwIcon } from 'lucide-react';
import { TimePeriod } from '@/types';
import Image from 'next/image';
import { TimePeriodSelector } from './TimePeriodSelector';
import { useState } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import { cn } from '@/lib/utils';

export function MarketList() {
  const [selectedTimePeriod, setSelectedTimePeriod] =
    useState<TimePeriod>('24h');

  const {
    marketData,
    isLoadingMarket,
    errorMarket,
    refetchMarket,
    isRefetchingMarket,
  } = useMarketData();

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Coins</h2>
        <TimePeriodSelector
          selectedPeriod={selectedTimePeriod}
          onPeriodChange={setSelectedTimePeriod}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground px-1">
          <span>Coin</span>
          <div className="flex items-center space-x-2">
            <span>Price </span>
            <RefreshCcwIcon
              onClick={() => refetchMarket()}
              className={cn(
                'h-4 w-4 cursor-pointer',
                (isLoadingMarket || isRefetchingMarket) && 'animate-spin'
              )}
            />
          </div>
        </div>

        {isLoadingMarket ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </>
        ) : errorMarket ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Failed to load market data</p>
          </div>
        ) : (
          <>
            {marketData?.map((coin, index) => {
              const getPriceChangePercentage = (period: TimePeriod): number => {
                switch (period) {
                  case '1h':
                    return coin.price_change_percentage_1h_in_currency || 0;
                  case '24h':
                    return coin.price_change_percentage_24h_in_currency || 0;
                  case '7d':
                    return coin.price_change_percentage_7d_in_currency || 0;
                  case '30d':
                    return coin.price_change_percentage_30d_in_currency || 0;
                  default:
                    return coin.price_change_percentage_24h_in_currency || 0;
                }
              };

              const priceChangePercentage =
                getPriceChangePercentage(selectedTimePeriod);
              const isPositive = priceChangePercentage >= 0;

              return (
                <Card key={coin.id} className="w-full p-2 px-4 h-16">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-muted-foreground">
                          #{index + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {coin.image ? (
                            <Image
                              src={coin.image}
                              alt={coin.symbol}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <span className="text-xs font-bold">
                              {coin.symbol.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="font-medium">{coin.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {coin.symbol}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col h-full justify-between">
                        <div className="font-medium text-sm">
                          ${coin.current_price.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-end space-x-1">
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <Badge
                            variant={isPositive ? 'default' : 'destructive'}
                            className="text-xs px-1 py-0"
                          >
                            {isPositive ? '+' : ''}
                            {priceChangePercentage.toFixed(2)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
