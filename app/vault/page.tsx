'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useSounds } from '../hooks/useSounds';
import { useUserSavings, useTotalVault, useClaimSavings } from '../hooks/useContracts';
import { useWallet } from '../hooks/useWallet';

export default function VaultPage() {
  const { isConnected, address } = useWallet();
  const { savings, isLoading: isSavingsLoading, refetch: refetchSavings } = useUserSavings(address as `0x${string}` | undefined);
  const { totalVault, isLoading: isVaultLoading, refetch: refetchVault } = useTotalVault();
  const { claimSavings, isPending: isClaimPending, isConfirming: isClaimConfirming, isSuccess: isClaimSuccess, error: claimError } = useClaimSavings();
  
  const [claimStatus, setClaimStatus] = useState<'idle' | 'claiming' | 'success' | 'error'>('idle');

  const statsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const soundManager = useSounds();

  const apy = 10.5;
  const projectedEarnings = savings * (apy / 100) * (90 / 365);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchSavings();
      refetchVault();
    }, 15000);

    return () => clearInterval(interval);
  }, [refetchSavings, refetchVault]);

  useEffect(() => {
    if (isClaimSuccess) {
      setClaimStatus('success');
      refetchSavings();
      soundManager?.playCashout();
      setTimeout(() => setClaimStatus('idle'), 3000);
    }
  }, [isClaimSuccess, refetchSavings, soundManager]);

  useEffect(() => {
    if (claimError) {
      setClaimStatus('error');
      setTimeout(() => setClaimStatus('idle'), 3000);
    }
  }, [claimError]);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (statsRef.current) {
      tl.fromTo(statsRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08 }
      );
    }

    if (contentRef.current) {
      tl.fromTo(contentRef.current,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35 },
        '-=0.15'
      );
    }

    return () => { tl.kill(); };
  }, []);

  const handleClaim = async () => {
    if (!isConnected || savings <= 0 || claimStatus !== 'idle') return;
    
    setClaimStatus('claiming');
    try {
      await claimSavings();
    } catch (error) {
      console.error('Error claiming savings:', error);
      setClaimStatus('error');
      setTimeout(() => setClaimStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg-primary">
      {/* Top Bar */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-border-subtle bg-bg-primary/80 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/lobby" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Lobby</span>
        </Link>
        
        <h1 className="text-base sm:text-lg font-semibold text-gold">Savings Vault</h1>
        
        <div className="w-8" /> {/* Spacer for centering */}
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald/10 border border-emerald/20 mb-4">
            <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-emerald font-medium">Earning {apy}% APY</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)] mb-2 sm:mb-3">
            Your Savings Vault
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-md mx-auto">
            Every bet contributes to your savings. Watch your money grow while you play.
          </p>
        </div>

        {/* Not Connected */}
        {!isConnected && (
          <div className="card p-8 sm:p-10 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 rounded-xl bg-bg-secondary flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-[var(--text-primary)] mb-2">Connect Your Wallet</h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Connect your wallet to view and manage your savings.
            </p>
          </div>
        )}

        {/* Connected */}
        {isConnected && (
          <>
            {/* Stats Grid */}
            <div ref={statsRef} className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
              <div className="stat-card">
                <div className="stat-label">Your Savings</div>
                {isSavingsLoading ? (
                  <div className="stat-value animate-pulse">...</div>
                ) : (
                  <div className="stat-value text-gold text-lg sm:text-xl md:text-2xl">{savings.toFixed(4)}</div>
                )}
                <div className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-0.5">MON</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">90-Day Est.</div>
                {isSavingsLoading ? (
                  <div className="stat-value animate-pulse">...</div>
                ) : (
                  <div className="stat-value text-emerald text-lg sm:text-xl md:text-2xl">+{projectedEarnings.toFixed(4)}</div>
                )}
                <div className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-0.5">@ {apy}%</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Protocol TVL</div>
                {isVaultLoading ? (
                  <div className="stat-value animate-pulse">...</div>
                ) : (
                  <div className="stat-value text-lg sm:text-xl md:text-2xl">{totalVault.toFixed(2)}</div>
                )}
                <div className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-0.5">MON</div>
              </div>
            </div>

            {/* Claim Section */}
            <div ref={contentRef} className="card p-4 sm:p-6 mb-6">
              <h3 className="text-base sm:text-lg font-medium text-[var(--text-primary)] mb-4">
                Claim Your Savings
              </h3>

              {savings <= 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-bg-secondary flex items-center justify-center">
                    <span className="text-xl">📭</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">No savings to claim yet</p>
                  <Link href="/crash">
                    <button className="btn-secondary text-sm">Start Playing</button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-bg-secondary rounded-xl p-3 sm:p-4 flex items-center justify-between">
                    <span className="text-sm text-[var(--text-muted)]">Available</span>
                    <span className="counter text-lg sm:text-xl font-bold text-gold">{savings.toFixed(4)} MON</span>
                  </div>

                  {claimStatus === 'success' && (
                    <div className="bg-emerald/10 border border-emerald/20 rounded-xl p-3 text-center">
                      <span className="text-sm text-emerald font-medium">Successfully claimed!</span>
                    </div>
                  )}

                  {claimStatus === 'error' && (
                    <div className="bg-ruby/10 border border-ruby/20 rounded-xl p-3 text-center">
                      <span className="text-sm text-ruby font-medium">Failed. Please try again.</span>
                    </div>
                  )}

                  <button 
                    onClick={handleClaim}
                    onMouseEnter={() => soundManager?.playHover()}
                    disabled={claimStatus !== 'idle' || isClaimPending || isClaimConfirming}
                    className="btn-primary w-full py-3 sm:py-4 disabled:opacity-60"
                  >
                    {claimStatus === 'claiming' || isClaimPending || isClaimConfirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        <span>{isClaimConfirming ? 'Confirming...' : 'Processing...'}</span>
                      </span>
                    ) : (
                      <span>Claim {savings.toFixed(4)} MON</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="card p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-[var(--text-primary)] mb-4">
                How It Works
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">💰</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-0.5 text-sm">Auto-Save</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      A portion of every bet goes to your savings.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary">
                  <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">📈</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-0.5 text-sm">Earn Yield</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Savings earn {apy}% APY while deposited.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary">
                  <div className="w-8 h-8 rounded-lg bg-sapphire/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">🔓</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-0.5 text-sm">No Lock-up</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Claim anytime with no waiting period.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">🔗</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-0.5 text-sm">On-Chain</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Transparent and verifiable transactions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
