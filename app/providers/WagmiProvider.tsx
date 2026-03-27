'use client';

import { createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider as WagmiProviderBase } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { monadTestnet } from '../config/contracts';

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(), // Support any injected wallet (MetaMask, Rabby, Coinbase, etc.)
  ],
  transports: {
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchInterval: 10000,
    },
  },
});

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProviderBase config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderBase>
  );
}
