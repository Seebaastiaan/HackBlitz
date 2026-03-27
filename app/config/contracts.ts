import { defineChain } from 'viem';

// Monad Testnet Chain Definition
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
});

// Contract Addresses
export const CONTRACTS = {
  BetChain: '0x6B564506Af298bD6c263b6C695071E25186ACA86' as `0x${string}`,
  CrashGame: '0xa7eF3ea62EfA084180769D1CC621c69E6F034FDC' as `0x${string}`,
} as const;

// BetChain ABI
export const BetChainABI = [
  {
    name: 'userSavings',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSavingsVault',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'claimSavings',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

// CrashGame ABI
export const CrashGameABI = [
  {
    name: 'bet',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'cashOut',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'multiplier', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'startRound',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'resolveRound',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'currentRound',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getCurrentCrashPoint',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Events for listening
  {
    name: 'BetPlaced',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'round', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'CashOut',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'multiplier', type: 'uint256', indexed: false },
      { name: 'payout', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'RoundStarted',
    type: 'event',
    inputs: [
      { name: 'round', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'RoundResolved',
    type: 'event',
    inputs: [
      { name: 'round', type: 'uint256', indexed: false },
      { name: 'crashPoint', type: 'uint256', indexed: false },
    ],
  },
] as const;
