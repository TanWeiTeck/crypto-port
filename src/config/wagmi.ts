import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, base, bsc } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Crypto Portfolio Tracker',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [mainnet, base, sepolia, bsc],
  ssr: true,
});

export const supportedChains = [sepolia];
