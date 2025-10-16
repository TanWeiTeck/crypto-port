'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';
import Image from 'next/image';
import { useMarketData } from '@/hooks/useMarketData';

export function TrendingCard() {
  const { trendingData, isLoadingTrending, errorTrending } = useMarketData();

  if (isLoadingTrending) {
    return (
      <>
        <div className="h-[214px] w-full bg-muted animate-pulse rounded-lg" />
      </>
    );
  }

  if (errorTrending) {
    return (
      <div className="h-[214px] w-full bg-card rounded-lg justify-center items-center flex text-muted-foreground">
        <p>Failed to load trending data</p>
      </div>
    );
  }

  return (
    <Card className="w-full p-4">
      <CardHeader className="w-full flex items-center justify-between p-0">
        <div className="flex items-center space-x-2 flex-1">
          <Flame className="h-4 w-4 text-orange-500" />
          <CardTitle className="text-sm font-medium">Trending</CardTitle>
        </div>
        <div className="text-xs text-muted-foreground font-medium">24h</div>
      </CardHeader>
      <CardContent className="space-y-2 p-0">
        {trendingData?.slice(0, 3).map((coin) => (
          <div key={coin.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Image
                  src={coin.image || ''}
                  alt={coin.symbol}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">
                  {coin.symbol.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {coin.name}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-xs font-medium">
                ${coin.current_price.toFixed(2)}
              </div>
              {coin.price_change_percentage_24h && (
                <Badge
                  variant={
                    coin.price_change_percentage_24h >= 0
                      ? 'default'
                      : 'destructive'
                  }
                  className="text-xs px-1 py-0 h-4"
                >
                  {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                  {coin.price_change_percentage_24h.toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
