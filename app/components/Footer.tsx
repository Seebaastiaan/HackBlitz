'use client';

import { useSounds } from '../hooks/useSounds';

export default function Footer() {
  const soundManager = useSounds();
  
  return (
    <footer className="relative z-50 border-t border-border-subtle bg-bg-secondary/80 backdrop-blur-md py-4 md:py-5 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">Powered by</span>
            <span 
              className="font-semibold text-text-primary cursor-pointer hover:text-gold transition-colors"
              onMouseEnter={() => soundManager?.playHover()}
            >
              Monad
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">Savings backed by</span>
            <span 
              className="font-semibold text-emerald cursor-pointer hover:text-gold transition-colors"
              onMouseEnter={() => soundManager?.playHover()}
            >
              CETES
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>BetChain 2026</span>
            <span className="hidden md:inline text-border-subtle">|</span>
            <span className="hidden md:inline">Play responsibly</span>
            <span className="hidden md:inline text-border-subtle">|</span>
            <span className="hidden md:inline text-text-muted/60">
              Chain ID: 10143
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
