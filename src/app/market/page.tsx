'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingCard } from '@/components/market/MarketCard';
import { MarketList } from '@/components/market/MarketList';
import { TimePeriodSelector } from '@/components/market/TimePeriodSelector';
import { useMarketData } from '@/hooks/useMarketData';
import { TimePeriod } from '@/types';
import { Flame, Rocket } from 'lucide-react';

export default function MarketPage() {
  return (
    <>
      {/* Trending */}
      <TrendingCard />

      {/* Market List */}
      <MarketList />
    </>
  );
}
