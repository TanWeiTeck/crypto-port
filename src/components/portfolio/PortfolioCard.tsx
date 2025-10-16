'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { cn } from '@/lib/utils';
import { useAtom } from 'jotai';
import { portfolioAtom, portfolioValueMaskAtom } from '@/store';
import { useAccount } from 'wagmi';

export function PortfolioCard() {
  const [isMasked, setIsMasked] = useAtom(portfolioValueMaskAtom);
  const { isConnected } = useAccount();
  const [portfolio] = useAtom(portfolioAtom);

  const { totalValue, totalChangePercent24h, totalChangeValue24h } = portfolio;
  const isPositive = totalChangePercent24h >= 0;

  return (
    <Card className="w-full p-4 gap-2 h-40">
      <CardHeader className="p-0">
        <CardTitle className="flex justify-between h-11">
          <div className="text-lg text-muted-foreground flex items-center space-x-1">
            <span>My Portfolio</span>
          </div>
          <div className="flex justify-end">
            <ConnectButton accountStatus="address" showBalance={false} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isConnected ? (
          <div className="space-y-2">
            <div className="text-2xl font-bold flex items-center space-x-1">
              {' '}
              <span className="">$</span>
              <span className="text-2xl font-bold">
                {isMasked
                  ? '•••••'
                  : totalValue.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </span>
              {isMasked ? (
                <Eye
                  className="h-5 w-5 text-muted-foreground cursor-pointer"
                  onClick={() => setIsMasked(!isMasked)}
                />
              ) : (
                <EyeOff
                  className="h-5 w-5 text-muted-foreground cursor-pointer"
                  onClick={() => setIsMasked(!isMasked)}
                />
              )}
            </div>
            <div className="flex space-x-2 items-center">
              <span className="text-xs text-muted-foreground ">24h:</span>
              <div
                className={cn(
                  isPositive ? 'text-green-500' : 'text-red-500',
                  'text-xs'
                )}
              >
                {isPositive ? '+$' : '-$'}
                {Math.abs(totalChangeValue24h).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <Badge
                variant={isPositive ? 'default' : 'destructive'}
                className="text-xs"
              >
                {isPositive ? '+' : '-'}
                {Math.abs(totalChangePercent24h).toFixed(2)}%
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>Connect your wallet to see your assets</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
