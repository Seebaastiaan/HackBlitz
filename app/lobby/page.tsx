'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useSounds } from '../hooks/useSounds';
import { useTotalVault } from '../hooks/useContracts';

export default function LobbyPage() {
  const { totalVault, isLoading: isVaultLoading } = useTotalVault();
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  
  const soundManager = useSounds();

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (heroRef.current) {
      tl.fromTo(heroRef.current.children,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 }
      );
    }

    if (cardsRef.current) {
      tl.fromTo(cardsRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.12 },
        '-=0.3'
      );
    }

    return () => { tl.kill(); };
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col bg-bg-primary overflow-x-clip">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gold/8 blur-3xl" />
        <div className="absolute top-112 -left-24 h-64 w-64 rounded-full bg-sapphire/10 blur-3xl" />
        <div className="absolute bottom-8 -right-20 h-72 w-72 rounded-full bg-emerald/10 blur-3xl" />
      </div>

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">
        {/* Hero Section */}
        <div ref={heroRef} className="text-center mb-10 sm:mb-12 md:mb-16">
          {/* Live Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bg-secondary/90 border border-border-subtle mb-4 sm:mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-text-secondary">Live on Monad Testnet</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-4 sm:mb-6 leading-[1.06]">
            <span className="text-text-primary">Play. Win.</span>
            <br />
            <span className="text-gradient-gold">Save Automatically.</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            The first on-chain casino that makes you richer even when you lose. 
            A portion of every bet goes into your savings vault.
          </p>

          {/* Protocol Stats */}
          <div className="inline-grid grid-cols-2 items-center gap-3 sm:gap-8 px-4 sm:px-8 py-4 sm:py-5 rounded-2xl bg-bg-card/95 border border-border-subtle shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
            <div className="text-center min-w-32">
              <div className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider mb-0.5 sm:mb-1">TVL</div>
              {isVaultLoading ? (
                <div className="counter text-xl sm:text-2xl md:text-3xl font-bold text-gold animate-pulse">...</div>
              ) : (
                <div className="counter text-xl sm:text-2xl md:text-3xl font-bold text-gold">{totalVault.toFixed(2)} MON</div>
              )}
            </div>
            <div className="text-center min-w-32 border-l border-border-subtle pl-3 sm:pl-8">
              <div className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider mb-0.5 sm:mb-1">APY</div>
              <div className="counter text-xl sm:text-2xl md:text-3xl font-bold text-emerald">10.5%</div>
            </div>
          </div>
        </div>

        {/* Game Cards */}
        <div ref={cardsRef} className="grid md:grid-cols-2 gap-5 lg:gap-6 max-w-5xl mx-auto mb-10 sm:mb-14">
          {/* Crash Game Card */}
          <Link href="/crash" className="group block">
            <div 
              className="card p-4 sm:p-6 h-full cursor-pointer hover:border-gold/35 hover:-translate-y-1 transition-all duration-300 shadow-[0_14px_36px_rgba(0,0,0,0.35)]"
              onMouseEnter={() => soundManager?.playHover()}
            >
              {/* Game Preview */}
              <div className="relative h-40 sm:h-44 mb-4 rounded-xl bg-bg-secondary overflow-hidden border border-border-subtle/60">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="curveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--gold-dark)" />
                      <stop offset="100%" stopColor="var(--gold)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 180 Q 100 160 150 120 T 250 60 T 380 10"
                    fill="none"
                    stroke="url(#curveGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="opacity-50 group-hover:opacity-100 transition-opacity"
                  />
                </svg>
                
                <div className="absolute top-1/2 right-6 -translate-y-1/2">
                  <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform inline-block">🐔</span>
                </div>

                <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-bg-primary/80 backdrop-blur-sm border border-gold/20">
                  <span className="counter text-base sm:text-lg font-bold text-gold">2.5x</span>
                </div>
              </div>

              {/* Game Info */}
              <div className="mb-3">
                <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-1 flex items-center gap-2 flex-wrap">
                  El Pollito
                  <span className="badge badge-gold">Popular</span>
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Cash out before the crash. How high will you go?
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-text-muted">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full" />
                  <span>Live</span>
                </div>
                <span>Min: 0.001 MON</span>
              </div>
            </div>
          </Link>

          {/* Blackjack Card */}
          <Link href="/blackjack" className="group block">
            <div 
              className="card p-4 sm:p-6 h-full cursor-pointer hover:border-gold/35 hover:-translate-y-1 transition-all duration-300 shadow-[0_14px_36px_rgba(0,0,0,0.35)]"
              onMouseEnter={() => soundManager?.playHover()}
            >
              {/* Game Preview */}
              <div className="relative h-40 sm:h-44 mb-4 rounded-xl bg-bg-secondary overflow-hidden flex items-center justify-center border border-border-subtle/60">
                <div className="flex items-center -space-x-6 group-hover:-space-x-3 transition-all duration-300">
                  <div className="w-12 h-18 sm:w-14 sm:h-20 bg-white rounded-lg shadow-lg flex flex-col items-center justify-center -rotate-10 group-hover:-rotate-5 transition-transform">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">A</span>
                    <span className="text-base sm:text-lg">♠</span>
                  </div>
                  <div className="w-12 h-18 sm:w-14 sm:h-20 bg-white rounded-lg shadow-lg flex flex-col items-center justify-center rotate-10 group-hover:rotate-5 transition-transform">
                    <span className="text-lg sm:text-xl font-bold text-red-600">K</span>
                    <span className="text-base sm:text-lg text-red-600">♥</span>
                  </div>
                </div>

                <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-emerald/20 backdrop-blur-sm border border-emerald/30">
                  <span className="counter text-base sm:text-lg font-bold text-emerald">21</span>
                </div>
              </div>

              {/* Game Info */}
              <div className="mb-3">
                <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-1 flex items-center gap-2 flex-wrap">
                  Blackjack
                  <span className="badge badge-emerald">Classic</span>
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Beat the dealer to 21. Double your bet.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-text-muted">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                  <span>Demo</span>
                </div>
                <span>Min: 0.001 MON</span>
              </div>
            </div>
          </Link>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/crash">
              <button 
                className="btn-primary px-7 sm:px-8 py-3 sm:py-4 text-sm sm:text-base w-full sm:w-auto"
                onMouseEnter={() => soundManager?.playHover()}
              >
                <span>Start Playing</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </Link>
            <Link href="/vault">
              <button 
                className="btn-secondary px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base w-full sm:w-auto"
                onMouseEnter={() => soundManager?.playHover()}
              >
                View Savings
              </button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          <div className="stat-card text-center bg-bg-card/90">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-xl bg-gold/10 flex items-center justify-center">
              <span className="text-xl sm:text-2xl">💰</span>
            </div>
            <h4 className="font-medium text-text-primary mb-1 text-sm sm:text-base">Auto-Save</h4>
            <p className="text-xs sm:text-sm text-text-secondary">
              Every bet contributes to your savings vault.
            </p>
          </div>

          <div className="stat-card text-center bg-bg-card/90">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-xl bg-emerald/10 flex items-center justify-center">
              <span className="text-xl sm:text-2xl">📈</span>
            </div>
            <h4 className="font-medium text-text-primary mb-1 text-sm sm:text-base">Earn Yield</h4>
            <p className="text-xs sm:text-sm text-text-secondary">
              Your savings generate 10.5% APY while you play.
            </p>
          </div>

          <div className="stat-card text-center bg-bg-card/90">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-xl bg-sapphire/10 flex items-center justify-center">
              <span className="text-xl sm:text-2xl">🔗</span>
            </div>
            <h4 className="font-medium text-text-primary mb-1 text-sm sm:text-base">On-Chain</h4>
            <p className="text-xs sm:text-sm text-text-secondary">
              100% transparent on Monad blockchain.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
