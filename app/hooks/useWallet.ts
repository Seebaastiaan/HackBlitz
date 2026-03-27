'use client';

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import { formatEther } from 'viem';
import { monadTestnet } from '../config/contracts';

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  
  // Get MON balance
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useBalance({
    address,
  });

  const isCorrectChain = chain?.id === monadTestnet.id;

  const connectWallet = async () => {
    const injectedConnector = connectors.find(c => c.id === 'injected');
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  const switchToMonad = async () => {
    try {
      await switchChain({ chainId: monadTestnet.id });
    } catch (err) {
      console.error('Error switching chain:', err);
      // If chain doesn't exist, try to add it
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${monadTestnet.id.toString(16)}`,
              chainName: monadTestnet.name,
              nativeCurrency: monadTestnet.nativeCurrency,
              rpcUrls: [monadTestnet.rpcUrls.default.http[0]],
              blockExplorerUrls: [monadTestnet.blockExplorers.default.url],
            }],
          });
        } catch (addError) {
          console.error('Error adding chain:', addError);
        }
      }
    }
  };

  const balanceFormatted = balanceData ? formatEther(balanceData.value) : '0';

  return {
    address,
    isConnected,
    isCorrectChain,
    chain,
    balance: balanceData ? Number(formatEther(balanceData.value)) : 0,
    balanceFormatted,
    isConnecting,
    isSwitching,
    isBalanceLoading,
    connectError,
    connectWallet,
    disconnect,
    switchToMonad,
    refetchBalance,
  };
}
