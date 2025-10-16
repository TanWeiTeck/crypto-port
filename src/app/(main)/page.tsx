'use client';

import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { AITradingCard } from '@/components/ai/AITradingCard';
import { useTokens } from '@/hooks/useTokens';
import PortfolioList from '@/components/portfolio/PortfolioList';

export default function Home() {
  useTokens(); // This will fetch tokens when wallet is connected

  return (
    <>
      <PortfolioCard />
      <AITradingCard />
      <PortfolioList />
    </>
  );
}
