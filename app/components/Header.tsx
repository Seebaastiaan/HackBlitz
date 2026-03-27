'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useSounds } from '../hooks/useSounds';
import { useWallet } from '../hooks/useWallet';
import { useUserSavings } from '../hooks/useContracts';
import ClientOnly from './ClientOnly';

export default function Header() {
  const [showCopied, setShowCopied] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const soundManager = useSounds();
  const { 
    address, 
    isConnected, 
    isCorrectChain, 
    balance, 
    isConnecting,
    connectWallet, 
    switchToMonad 
  } = useWallet();
  
  const { savings } = useUserSavings(address);

  // Show network modal if connected but wrong chain
  useEffect(() => {
    setShowNetworkModal(isConnected && !isCorrectChain);
  }, [isConnected, isCorrectChain]);

  const handleConnect = async () => {
    soundManager?.playClick();
    try {
      await connectWallet();
      soundManager?.playWalletConnected();
      showToast('Wallet conectada');
    } catch (error) {
      console.error('Error connecting:', error);
      soundManager?.playError();
    }
  };

  const handleSwitchNetwork = async () => {
    soundManager?.playClick();
    await switchToMonad();
    soundManager?.playWin();
    setShowNetworkModal(false);
    showToast('Red cambiada a Monad');
  };

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-24 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl text-sm font-medium';
    toast.style.cssText = `
      background: var(--bg-elevated);
      border: 1px solid var(--gold);
      color: var(--gold);
      box-shadow: var(--shadow-gold);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    gsap.fromTo(toast,
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    
    setTimeout(() => {
      gsap.to(toast, {
        y: -10,
        opacity: 0,
        duration: 0.2,
        onComplete: () => toast.remove()
      });
    }, 2500);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setShowCopied(true);
      soundManager?.playClick();
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link 
              href="/lobby" 
              className="flex items-center gap-2 group"
              onMouseEnter={() => soundManager?.playHover()}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-linear-to-br from-gold to-gold-dark flex items-center justify-center">
                <span className="text-lg md:text-xl">🎲</span>
              </div>
              <span className="text-xl md:text-2xl font-semibold tracking-tight">
                <span className="text-gradient-gold">Bet</span>
                <span className="text-text-primary">Chain</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link 
                href="/lobby"
                className="btn-ghost"
                onMouseEnter={() => soundManager?.playHover()}
              >
                Lobby
              </Link>
              <Link 
                href="/crash"
                className="btn-ghost"
                onMouseEnter={() => soundManager?.playHover()}
              >
                Crash
              </Link>
              <Link 
                href="/blackjack"
                className="btn-ghost"
                onMouseEnter={() => soundManager?.playHover()}
              >
                Blackjack
              </Link>
              <Link 
                href="/vault"
                className="btn-ghost"
                onMouseEnter={() => soundManager?.playHover()}
              >
                Vault
              </Link>
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Balance Display - Desktop */}
              <ClientOnly>
                {isConnected && isCorrectChain && (
                  <div className="hidden lg:flex items-center gap-4 mr-2">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-bg-secondary border border-border-subtle">
                      <div className="text-right">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider">Balance</div>
                        <div className="counter text-sm text-text-primary">
                          {balance.toFixed(4)} <span className="text-text-muted">MON</span>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-border-subtle"></div>
                      <div className="text-right">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider">Savings</div>
                        <div className="counter text-sm text-emerald">
                          {savings.toFixed(4)} <span className="text-text-muted">MON</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ClientOnly>

              {/* Network Warning */}
              {isConnected && !isCorrectChain && (
                <button
                  onClick={() => setShowNetworkModal(true)}
                  onMouseEnter={() => soundManager?.playHover()}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-ruby/10 border border-ruby/30 text-ruby text-xs font-medium"
                >
                  <span className="w-2 h-2 bg-ruby rounded-full animate-pulse" />
                  Wrong Network
                </button>
              )}
              
              {/* Wallet Button */}
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  onMouseEnter={() => soundManager?.playHover()}
                  disabled={isConnecting}
                  className="btn-primary text-sm"
                >
                  {isConnecting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Connecting</span>
                    </span>
                  ) : (
                    <span>Connect Wallet</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={copyAddress}
                  onMouseEnter={() => soundManager?.playHover()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-secondary border border-border-subtle hover:border-border-default transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${isCorrectChain ? 'bg-emerald' : 'bg-ruby animate-pulse'}`} />
                  <span className="mono text-sm text-text-primary">
                    {address && truncateAddress(address)}
                  </span>
                  {showCopied ? (
                    <svg className="w-4 h-4 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                <svg className="w-6 h-6 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border-subtle animate-fade-in">
              {/* Mobile Balance */}
              <ClientOnly>
                {isConnected && isCorrectChain && (
                  <div className="flex items-center justify-center gap-6 mb-4 py-3 px-4 rounded-xl bg-bg-secondary">
                    <div className="text-center">
                      <div className="text-[10px] text-text-muted uppercase">Balance</div>
                      <div className="counter text-sm text-text-primary">{balance.toFixed(4)} MON</div>
                    </div>
                    <div className="w-px h-8 bg-border-subtle"></div>
                    <div className="text-center">
                      <div className="text-[10px] text-text-muted uppercase">Savings</div>
                      <div className="counter text-sm text-emerald">{savings.toFixed(4)} MON</div>
                    </div>
                  </div>
                )}
              </ClientOnly>
              
              <nav className="flex flex-col gap-1">
                <Link 
                  href="/lobby"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                >
                  Lobby
                </Link>
                <Link 
                  href="/crash"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                >
                  Crash
                </Link>
                <Link 
                  href="/blackjack"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                >
                  Blackjack
                </Link>
                <Link 
                  href="/vault"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                >
                  Vault
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Network Switch Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-bg-card border border-border-default rounded-2xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-ruby/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-ruby" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Wrong Network
              </h2>
              <p className="text-sm text-text-secondary">
                Please switch to Monad Testnet to continue using BetChain.
              </p>
            </div>

            <div className="bg-bg-secondary rounded-xl p-4 mb-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Required Network</span>
                <span className="font-medium text-text-primary">Monad Testnet</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Chain ID</span>
                <span className="mono text-text-secondary">10143</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleSwitchNetwork}
                onMouseEnter={() => soundManager?.playHover()}
                className="btn-primary w-full py-3"
              >
                <span>Switch Network</span>
              </button>
              <button
                onClick={() => setShowNetworkModal(false)}
                onMouseEnter={() => soundManager?.playHover()}
                className="btn-ghost w-full text-text-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
