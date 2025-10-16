'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Token } from '@/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { portfolioValueMaskAtom } from '@/store';
import { useAtom } from 'jotai';

interface TokenCardProps {
  token: Token;
}

export function TokenCard({ token }: TokenCardProps) {
  const isPositive = token.change24hValue >= 0;
  const [isMasked] = useAtom(portfolioValueMaskAtom);

  return (
    <Card className="w-full p-4 h-36">
      <CardContent className="p-0 space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {token.logoUrl ? (
                <Image
                  src={token.logoUrl}
                  alt={token.symbol}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <span className="text-sm text-primary font-bold">
                  {token.symbol.slice(0, 2)}
                </span>
              )}
            </div>
            <div>
              <div className="font-medium text-foreground text-base">
                {token.symbol}
              </div>
              <div className="text-sm text-muted-foreground">{token.name}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-medium text-foreground text-base">
              {isMasked ? '•••••' : `${parseFloat(token.balance).toFixed(4)}`}
            </div>
            <div className="text-sm text-muted-foreground">
              {isMasked
                ? '•••••'
                : `$${token.value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between space-x-1">
            <div>24h:</div>
            <div className="flex items-center space-x-1">
              <div
                className={cn(
                  isPositive ? 'text-green-500' : 'text-red-500',
                  'text-xs'
                )}
              >
                {isPositive ? '+$' : '-$'}
                {Math.abs(token.change24hValue).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <Badge
                variant={isPositive ? 'default' : 'destructive'}
                className="text-xs"
              >
                {isPositive ? '+' : '-'}
                {Math.abs(token.change24hPercent).toFixed(2)}%
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>Price:</div>
            <div>
              $
              {token.price.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}
            </div>
          </div>
        </div>

        {/* Development: Show token address */}
        {/* <div className="mt-2 text-xs text-muted-foreground/60 font-mono truncate">
          {token.address}
        </div> */}
      </CardContent>
    </Card>
  );
}
