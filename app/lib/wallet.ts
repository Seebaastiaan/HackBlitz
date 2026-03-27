// Monad Testnet Configuration
export const MONAD_TESTNET = {
  chainId: '0x2795', // 10143 in hex
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet-explorer.monad.xyz'],
};

export const MONAD_CHAIN_ID = 10143;

// Wallet connection utilities
export async function connectWallet(): Promise<string | null> {
  if (typeof window.ethereum === 'undefined') {
    alert('Por favor instala MetaMask para continuar');
    return null;
  }

  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return null;
  }
}

export async function switchToMonadTestnet(): Promise<boolean> {
  if (typeof window.ethereum === 'undefined') {
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MONAD_TESTNET.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [MONAD_TESTNET],
        });
        return true;
      } catch (addError) {
        console.error('Error adding Monad network:', addError);
        return false;
      }
    }
    console.error('Error switching network:', switchError);
    return false;
  }
}

export async function getCurrentChainId(): Promise<number | null> {
  if (typeof window.ethereum === 'undefined') {
    return null;
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
}

export function isMonadTestnet(chainId: number): boolean {
  return chainId === MONAD_CHAIN_ID;
}
