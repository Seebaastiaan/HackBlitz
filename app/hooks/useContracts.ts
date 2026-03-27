'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS, CrashGameABI, BetChainABI } from '../config/contracts';

// Hook para leer el round actual
export function useCurrentRound() {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.CrashGame,
    abi: CrashGameABI,
    functionName: 'currentRound',
  });

  return {
    currentRound: data ? Number(data) : 0,
    isLoading,
    refetch,
  };
}

// Hook para obtener el crash point actual (si está disponible)
export function useCurrentCrashPoint() {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.CrashGame,
    abi: CrashGameABI,
    functionName: 'getCurrentCrashPoint',
  });

  return {
    // El crash point viene como uint256 con 2 decimales (ej: 234 = 2.34x)
    crashPoint: data ? Number(data) / 100 : null,
    isLoading,
    refetch,
  };
}

// Hook para hacer una apuesta
export function useBet() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const bet = async (amountInMon: number) => {
    try {
      await writeContract({
        address: CONTRACTS.CrashGame,
        abi: CrashGameABI,
        functionName: 'bet',
        value: parseEther(amountInMon.toString()),
      });
    } catch (err) {
      console.error('Error placing bet:', err);
      throw err;
    }
  };

  return {
    bet,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook para hacer cash out
export function useCashOut() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cashOut = async (multiplier: number) => {
    try {
      // Multiplicador se envía como uint256 con 2 decimales (ej: 2.34 -> 234)
      const multiplierInt = Math.floor(multiplier * 100);
      
      await writeContract({
        address: CONTRACTS.CrashGame,
        abi: CrashGameABI,
        functionName: 'cashOut',
        args: [BigInt(multiplierInt)],
      });
    } catch (err) {
      console.error('Error cashing out:', err);
      throw err;
    }
  };

  return {
    cashOut,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook para leer los ahorros del usuario
export function useUserSavings(address: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.BetChain,
    abi: BetChainABI,
    functionName: 'userSavings',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    savings: data ? Number(formatEther(data)) : 0,
    savingsRaw: data,
    isLoading,
    refetch,
  };
}

// Hook para leer el total del vault
export function useTotalVault() {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.BetChain,
    abi: BetChainABI,
    functionName: 'totalSavingsVault',
  });

  return {
    totalVault: data ? Number(formatEther(data)) : 0,
    totalVaultRaw: data,
    isLoading,
    refetch,
  };
}

// Hook para reclamar ahorros
export function useClaimSavings() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimSavings = async () => {
    try {
      await writeContract({
        address: CONTRACTS.BetChain,
        abi: BetChainABI,
        functionName: 'claimSavings',
      });
    } catch (err) {
      console.error('Error claiming savings:', err);
      throw err;
    }
  };

  return {
    claimSavings,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
