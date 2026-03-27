'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useSounds } from '../hooks/useSounds';
import { useBet, useCashOut, useCurrentRound } from '../hooks/useContracts';
import { useWallet } from '../hooks/useWallet';

interface Player {
  name: string;
  cashout: number;
  amount: number;
  cashedOut: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export default function CrashPage() {
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [displayMultiplier, setDisplayMultiplier] = useState<string>('1.00');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [betAmount, setBetAmount] = useState<number>(0.001);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lastCrashPoint, setLastCrashPoint] = useState<number | null>(null);
  const [crashHistory, setCrashHistory] = useState<number[]>([2.34, 1.12, 7.89, 1.54, 3.21, 12.45, 1.03, 4.56]);
  const [players, setPlayers] = useState<Player[]>([
    { name: 'whale.eth', cashout: 0, amount: 0.5, cashedOut: false },
    { name: 'degen_01', cashout: 0, amount: 0.1, cashedOut: false },
    { name: 'moon_boy', cashout: 0, amount: 0.25, cashedOut: false },
  ]);
  const [txStatus, setTxStatus] = useState<'idle' | 'betting' | 'confirming' | 'cashing_out'>('idle');
  const [showPlayers, setShowPlayers] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(1);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const curvePointsRef = useRef<{x: number, y: number}[]>([]);
  const pollitoPositionRef = useRef<{x: number, y: number}>({x: 0, y: 0});
  const containerRef = useRef<HTMLDivElement>(null);
  
  const soundManager = useSounds();
  
  const { isConnected } = useWallet();
  const { bet } = useBet();
  const { cashOut: contractCashOut } = useCashOut();
  const { refetch: refetchRound } = useCurrentRound();

  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 50; i++) {
      stars.push({
        x: Math.random() * 1000,
        y: Math.random() * 600,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    starsRef.current = stars;
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#08080A');
    bgGradient.addColorStop(1, '#101014');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    starsRef.current.forEach((star, i) => {
      if (isPlaying) {
        star.y += star.speed;
        star.x -= star.speed * 0.2;
        if (star.y > height) star.y = 0;
        if (star.x < 0) star.x = width;
      }
      
      const twinkle = Math.sin(Date.now() * 0.002 + i) * 0.2 + 0.8;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle * 0.25})`;
      ctx.fill();
    });

    if (curvePointsRef.current.length > 1) {
      ctx.beginPath();
      ctx.moveTo(curvePointsRef.current[0].x, curvePointsRef.current[0].y);
      
      for (let i = 1; i < curvePointsRef.current.length; i++) {
        ctx.lineTo(curvePointsRef.current[i].x, curvePointsRef.current[i].y);
      }
      
      const gradient = ctx.createLinearGradient(0, height, width, 0);
      if (hasCrashed) {
        gradient.addColorStop(0, '#E74C3C');
        gradient.addColorStop(1, '#E74C3C');
      } else {
        gradient.addColorStop(0, '#996515');
        gradient.addColorStop(0.5, '#D4AF37');
        gradient.addColorStop(1, '#F4E4BA');
      }
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      ctx.shadowColor = hasCrashed ? '#E74C3C' : '#D4AF37';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if ((isPlaying || hasCrashed) && pollitoPositionRef.current) {
      const pos = pollitoPositionRef.current;
      
      ctx.save();
      ctx.translate(pos.x, pos.y);
      
      if (hasCrashed) {
        ctx.globalAlpha = 0.6;
        ctx.rotate(Date.now() * 0.01);
      } else {
        ctx.rotate(Math.sin(Date.now() * 0.008) * 0.1);
      }
      
      const fontSize = Math.min(width, height) * 0.12;
      ctx.font = `${hasCrashed ? fontSize * 0.7 : fontSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hasCrashed ? '💥' : '🐔', 0, 0);
      ctx.restore();
      
      if (isPlaying && !hasCrashed) {
        particlesRef.current.push({
          x: pos.x - 12,
          y: pos.y,
          vx: -Math.random() * 1.5 - 0.5,
          vy: Math.random() * 1 - 0.5,
          size: Math.random() * 2 + 1,
          color: '#D4AF37',
          life: 1,
          maxLife: 1,
        });
      }
    }

    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      
      if (p.life <= 0) return false;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life * 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
      
      return true;
    });

    if (hasCrashed && particlesRef.current.length < 30) {
      const pos = pollitoPositionRef.current;
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        particlesRef.current.push({
          x: pos.x,
          y: pos.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          color: ['#E74C3C', '#D4AF37', '#F4E4BA'][Math.floor(Math.random() * 3)],
          life: 1,
          maxLife: 1,
        });
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    gameLoopRef.current = requestAnimationFrame(render);
  }, [isPlaying, hasCrashed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    gameLoopRef.current = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [render]);

  const startGame = async () => {
    if (isPlaying || countdown !== null || txStatus !== 'idle') return;
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setTxStatus('betting');
    
    try {
      await bet(betAmount);
      setTxStatus('confirming');
      
      soundManager?.playCountdown();
      setCountdown(3);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            if (prev === 1) {
              soundManager?.playCountdownFinal();
              actuallyStartGame();
            }
            return null;
          }
          soundManager?.playCountdown();
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error placing bet:', error);
      setTxStatus('idle');
    }
  };

  const actuallyStartGame = () => {
    setIsPlaying(true);
    setHasCrashed(false);
    setHasCashedOut(false);
    setMultiplier(1.00);
    setDisplayMultiplier('1.00');
    setWinAmount(0);
    setTxStatus('idle');
    curvePointsRef.current = [];
    particlesRef.current = [];
    
    setPlayers(prev => prev.map(p => ({ ...p, cashout: 0, cashedOut: false })));
    crashPointRef.current = 1 + Math.pow(Math.random(), 0.7) * 14;
    startTimeRef.current = Date.now();
    
    soundManager?.playBet();
    refetchRound();

    const gameLoop = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const currentMultiplier = Math.pow(Math.E, elapsed * 0.08);
      
      if (currentMultiplier >= crashPointRef.current) {
        crash(crashPointRef.current);
        return;
      }
      
      setMultiplier(currentMultiplier);
      setDisplayMultiplier(currentMultiplier.toFixed(2));
      
      const canvas = canvasRef.current;
      if (canvas) {
        const container = canvas.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          const progress = Math.min((currentMultiplier - 1) / 9, 1);
          const x = 30 + progress * (rect.width - 60);
          const y = rect.height - 30 - Math.pow(progress, 0.7) * (rect.height - 60);
          
          curvePointsRef.current.push({ x, y });
          pollitoPositionRef.current = { x, y };
          
          if (curvePointsRef.current.length > 400) {
            curvePointsRef.current = curvePointsRef.current.slice(-400);
          }
        }
      }
      
      if (Math.floor(currentMultiplier) > Math.floor(currentMultiplier - 0.01)) {
        soundManager?.playMultiplierMilestone();
      }
      
      setPlayers(prev => prev.map(p => {
        if (!p.cashedOut && Math.random() < 0.005 * currentMultiplier) {
          return { ...p, cashout: currentMultiplier, cashedOut: true };
        }
        return p;
      }));
      
      requestAnimationFrame(gameLoop);
    };
    
    requestAnimationFrame(gameLoop);
  };

  const crash = (crashPoint: number) => {
    setHasCrashed(true);
    setIsPlaying(false);
    setLastCrashPoint(crashPoint);
    setCrashHistory(prev => [crashPoint, ...prev.slice(0, 7)]);
    
    soundManager?.playCrash();

    if (containerRef.current) {
      gsap.to(containerRef.current, {
        x: '+=5',
        duration: 0.04,
        yoyo: true,
        repeat: 5,
        ease: 'power1.inOut',
        onComplete: () => { gsap.set(containerRef.current, { x: 0 }); }
      });
    }

    setPlayers(prev => prev.map(p => !p.cashedOut ? { ...p, cashout: crashPoint, cashedOut: true } : p));

    setTimeout(() => {
      setHasCrashed(false);
      setMultiplier(1.00);
      setDisplayMultiplier('1.00');
      curvePointsRef.current = [];
      particlesRef.current = [];
    }, 3000);
  };

  const cashOut = async () => {
    if (!isPlaying || hasCashedOut || txStatus === 'cashing_out') return;

    setTxStatus('cashing_out');
    
    try {
      await contractCashOut(multiplier);
      
      setHasCashedOut(true);
      const winning = betAmount * multiplier;
      setWinAmount(winning);
      setIsPlaying(false);
      setTxStatus('idle');
      soundManager?.playCashout();

      setPlayers(prev => [
        { name: 'You', cashout: multiplier, amount: betAmount, cashedOut: true },
        ...prev.slice(0, 2)
      ]);
      
    } catch (error) {
      console.error('Error cashing out:', error);
      setTxStatus('idle');
      setHasCashedOut(true);
      setWinAmount(betAmount * multiplier);
      setIsPlaying(false);
      soundManager?.playCashout();
    }
  };

  const handleBetChange = (value: number) => {
    setBetAmount(value);
    soundManager?.playSliderTick();
  };

  const resetGame = () => {
    setHasCrashed(false);
    setHasCashedOut(false);
    setMultiplier(1.00);
    setDisplayMultiplier('1.00');
    curvePointsRef.current = [];
    setTxStatus('idle');
  };

  return (
    <div ref={containerRef} className="min-h-[100dvh] flex flex-col bg-bg-primary">
      {/* Top Bar */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-border-subtle bg-bg-primary/80 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/lobby" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Lobby</span>
        </Link>
        
        <h1 className="text-base sm:text-lg font-semibold text-gold">El Pollito</h1>
        
        <button 
          onClick={() => setShowPlayers(!showPlayers)}
          className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-secondary border border-border-subtle text-xs"
        >
          <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
          <span>{players.length}</span>
        </button>
      </header>

      {/* History Strip */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-border-subtle bg-bg-secondary/50">
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {crashHistory.map((crash, i) => (
            <div
              key={i}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                crash < 2 
                  ? 'bg-ruby/10 text-ruby border border-ruby/20' 
                  : crash < 5 
                    ? 'bg-gold/10 text-gold border border-gold/20'
                    : 'bg-emerald/10 text-emerald border border-emerald/20'
              }`}
            >
              {crash.toFixed(2)}x
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Game Column */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Multiplier Display */}
          <div className="flex-shrink-0 text-center py-2">
            {countdown !== null ? (
              <div className="counter text-5xl sm:text-6xl md:text-7xl font-bold text-gold animate-pulse">
                {countdown}
              </div>
            ) : (
              <>
                <div className={`counter text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold transition-colors leading-none ${
                  hasCrashed ? 'text-ruby' :
                  hasCashedOut ? 'text-emerald' :
                  multiplier > 5 ? 'text-emerald' :
                  multiplier > 2 ? 'text-gold' :
                  'text-[var(--text-primary)]'
                }`}>
                  {hasCrashed ? 'CRASH' : `${displayMultiplier}x`}
                </div>
                
                {hasCashedOut && (
                  <div className="counter text-lg sm:text-xl font-bold text-emerald mt-1">
                    +{winAmount.toFixed(4)} MON
                  </div>
                )}
                
                {hasCrashed && lastCrashPoint && (
                  <div className="text-sm text-[var(--text-muted)] mt-1">
                    @ {lastCrashPoint.toFixed(2)}x
                  </div>
                )}
              </>
            )}
          </div>

          {/* Canvas Container */}
          <div 
            className="flex-1 min-h-0 relative rounded-xl overflow-hidden border border-border-subtle bg-bg-secondary"
            style={{ minHeight: '140px', maxHeight: '300px' }}
          >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bet Input */}
            <div className="card p-3 sm:p-4">
              <label className="block text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 font-medium">
                Bet Amount (MON)
              </label>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[0.001, 0.005, 0.01, 0.05].map(amount => (
                  <button
                    key={amount}
                    onClick={() => handleBetChange(amount)}
                    disabled={isPlaying || txStatus !== 'idle'}
                    className={`py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${
                      betAmount === amount 
                        ? 'bg-gold text-[var(--bg-primary)]' 
                        : 'bg-bg-secondary text-[var(--text-secondary)] border border-border-subtle hover:border-gold/30'
                    } disabled:opacity-50`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={isPlaying || txStatus !== 'idle'}
                className="input text-center text-base"
                min="0.0001"
                max="1"
                step="0.0001"
              />
            </div>

            {/* Action Button */}
            <div className="flex flex-col justify-center gap-2">
              {!isPlaying && !hasCrashed && countdown === null && txStatus === 'idle' && (
                <button
                  onClick={startGame}
                  disabled={!isConnected}
                  className={`btn-primary py-3 sm:py-4 text-sm sm:text-base w-full ${!isConnected ? 'opacity-50' : ''}`}
                >
                  <span>{isConnected ? `Bet ${betAmount} MON` : 'Connect Wallet'}</span>
                </button>
              )}
              
              {(txStatus === 'betting' || txStatus === 'confirming') && (
                <div className="text-center py-3">
                  <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full mx-auto mb-1.5" />
                  <div className="text-xs text-[var(--text-secondary)]">
                    {txStatus === 'betting' ? 'Confirm...' : 'Processing...'}
                  </div>
                </div>
              )}

              {isPlaying && !hasCashedOut && (
                <button
                  onClick={cashOut}
                  disabled={txStatus === 'cashing_out'}
                  className="w-full py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base bg-emerald text-[var(--bg-primary)] hover:brightness-110 disabled:opacity-70 transition-all"
                >
                  {txStatus === 'cashing_out' ? 'Cashing...' : `Cash Out ${(betAmount * multiplier).toFixed(4)}`}
                </button>
              )}

              {countdown !== null && (
                <div className="text-center py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  Starting...
                </div>
              )}

              {hasCrashed && !hasCashedOut && (
                <div className="text-center">
                  <div className="text-sm text-ruby font-medium mb-2">Lost {betAmount.toFixed(4)} MON</div>
                  <button onClick={resetGame} className="btn-secondary text-sm py-2 px-4">Try Again</button>
                </div>
              )}

              {hasCashedOut && (
                <button onClick={resetGame} className="btn-primary w-full py-3">
                  <span>Play Again</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="card p-3 sticky top-20">
            <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
              Live Players
            </h3>
            <div className="space-y-1.5">
              {players.map((player, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-2 text-xs ${
                    player.cashedOut 
                      ? 'bg-emerald/5 border border-emerald/20' 
                      : 'bg-bg-secondary border border-border-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium truncate ${player.name === 'You' ? 'text-gold' : 'text-[var(--text-primary)]'}`}>
                      {player.name}
                    </span>
                    {player.cashedOut ? (
                      <span className="text-emerald font-medium">{player.cashout.toFixed(2)}x</span>
                    ) : isPlaying ? (
                      <span className="text-[10px] text-gold animate-pulse">Playing</span>
                    ) : null}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {player.amount.toFixed(4)} MON
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Players Panel */}
      {showPlayers && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-bg-card border-t border-border-subtle rounded-t-2xl p-4 animate-slide-up safe-area-bottom">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Live Players</h3>
            <button onClick={() => setShowPlayers(false)} className="p-1 text-[var(--text-muted)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {players.map((player, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                <span className="text-sm text-[var(--text-primary)]">{player.name}</span>
                <span className={`text-sm font-medium ${player.cashedOut ? 'text-emerald' : 'text-[var(--text-muted)]'}`}>
                  {player.cashedOut ? `${player.cashout.toFixed(2)}x` : `${player.amount} MON`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
