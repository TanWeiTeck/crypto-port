import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { portfolioAtom, isLoadingTokensAtom } from '@/store';
import { Checkbox } from '@/components/ui/checkbox';
import { TokenCard } from '@/components/tokens/TokenCard';
import { useAccount } from 'wagmi';

const PortfolioList = ({}) => {
  const [hideSmallAssets, setHideSmallAssets] = useState(false);

  const [portfolio] = useAtom(portfolioAtom);
  const [isLoadingTokens] = useAtom(isLoadingTokensAtom);
  const { isConnected } = useAccount();

  if (!isConnected) {
    return null;
  }
  return (
    <>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Your Assets
          </h2>
          {portfolio.tokens.length > 1 ? (
            <div className="flex items-center space-x-2">
              <label
                htmlFor="hide-small-assets"
                className="text-sm text-muted-foreground"
              >
                Hide assets &lt;1 USD
              </label>
              <Checkbox
                id="hide-small-assets"
                checked={hideSmallAssets}
                onCheckedChange={(checked: boolean) =>
                  setHideSmallAssets(checked)
                }
              />
            </div>
          ) : null}
        </div>

        {isLoadingTokens ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="h-36 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : portfolio.tokens.length > 0 ? (
          <div className="space-y-3">
            {portfolio.tokens
              .filter((token) => !hideSmallAssets || token.value > 1)
              .map((token, index) => (
                <TokenCard key={`${token.address}-${index}`} token={token} />
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tokens found in your wallet</p>
          </div>
        )}
      </div>
    </>
  );
};

export default PortfolioList;
