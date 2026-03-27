'use client';

import { WagmiProvider } from './providers/WagmiProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider>
      {children}
    </WagmiProvider>
  );
}
