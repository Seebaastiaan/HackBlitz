'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useSounds } from '../hooks/useSounds';

type Card = {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  numericValue: number;
  color: 'red' | 'black';
};

type HandHistory = {
  result: 'win' | 'lose' | 'push';
  playerScore: number;
  dealerScore: number;
  amount: number;
};

const CHIP_VALUES = [0.001, 0.005, 0.01, 0.05];
const CHIP_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  0.001: { bg: 'from-zinc-300 to-zinc-500', border: 'border-zinc-400', text: 'text-zinc-800' },
  0.005: { bg: 'from-ruby to-red-800', border: 'border-red-400', text: 'text-white' },
  0.01: { bg: 'from-emerald to-emerald-800', border: 'border-emerald-400', text: 'text-white' },
  0.05: { bg: 'from-gold to-amber-700', border: 'border-amber-300', text: 'text-zinc-900' },
};

export default function BlackjackPage() {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [betAmount, setBetAmount] = useState<number>(0.01);
  const [chipStack, setChipStack] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealer' | 'finished'>('betting');
  const [message, setMessage] = useState<string>('Place your bet');
  const [showDealerCard, setShowDealerCard] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(15);
  const [lastWin, setLastWin] = useState<number>(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HandHistory[]>([
    { result: 'win', playerScore: 21, dealerScore: 19, amount: 0.02 },
    { result: 'lose', playerScore: 23, dealerScore: 20, amount: 0.01 },
    { result: 'win', playerScore: 20, dealerScore: 18, amount: 0.05 },
  ]);
  
  const tableRef = useRef<HTMLDivElement>(null);
  const playerCardsRef = useRef<HTMLDivElement>(null);
  const chipStackRef = useRef<HTMLDivElement>(null);
  
  const soundManager = useSounds();

  useEffect(() => {
    const chips: number[] = [];
    let remaining = betAmount;
    
    for (const value of [...CHIP_VALUES].reverse()) {
      while (remaining >= value - 0.0001) {
        chips.push(value);
        remaining -= value;
      }
    }
    
    setChipStack(chips);
  }, [betAmount]);

  useEffect(() => {
    if (chipStackRef.current && chipStack.length > 0) {
      gsap.fromTo(chipStackRef.current.children,
        { scale: 0, y: -30 },
        { scale: 1, y: 0, duration: 0.25, stagger: 0.04, ease: 'back.out(1.5)' }
      );
    }
  }, [chipStack]);

  const createDeck = (): Card[] => {
    const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const newDeck: Card[] = [];

    for (let d = 0; d < 6; d++) {
      for (const suit of suits) {
        for (const value of values) {
          let numericValue = parseInt(value);
          if (value === 'A') numericValue = 11;
          else if (['J', 'Q', 'K'].includes(value)) numericValue = 10;

          newDeck.push({
            suit,
            value,
            numericValue,
            color: suit === '♥' || suit === '♦' ? 'red' : 'black'
          });
        }
      }
    }

    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    return newDeck;
  };

  const calculateScore = (hand: Card[]): number => {
    let score = hand.reduce((sum, card) => sum + card.numericValue, 0);
    let aces = hand.filter(card => card.value === 'A').length;

    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  };

  const dealCard = (currentDeck: Card[]): [Card, Card[]] => {
    const card = currentDeck[0];
    const remainingDeck = currentDeck.slice(1);
    return [card, remainingDeck];
  };

  const startGame = () => {
    if (betAmount > balance) {
      setMessage('Insufficient balance');
      soundManager?.playError();
      return;
    }

    soundManager?.playDeal();
    
    const newDeck = createDeck();

    const [playerCard1, deck1] = dealCard(newDeck);
    const [dealerCard1, deck2] = dealCard(deck1);
    const [playerCard2, deck3] = dealCard(deck2);
    const [dealerCard2, deck4] = dealCard(deck3);

    setPlayerHand([playerCard1, playerCard2]);
    setDealerHand([dealerCard1, dealerCard2]);
    setDeck(deck4);
    setGameState('playing');
    setShowDealerCard(false);
    setMessage('Hit or Stand?');
    setLastWin(0);

    if (playerCardsRef.current) {
      gsap.fromTo(playerCardsRef.current.children,
        { y: -100, rotateY: 180, opacity: 0 },
        { y: 0, rotateY: 0, opacity: 1, duration: 0.4, stagger: 0.12, ease: 'back.out(1.5)' }
      );
    }

    const playerScore = calculateScore([playerCard1, playerCard2]);
    if (playerScore === 21) {
      setTimeout(() => stand([playerCard1, playerCard2], [dealerCard1, dealerCard2], deck4), 1000);
    }
  };

  const hit = () => {
    soundManager?.playCardFlip();
    
    const [newCard, remainingDeck] = dealCard(deck);
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck(remainingDeck);

    setTimeout(() => {
      const cards = playerCardsRef.current?.children;
      if (cards && cards.length > 0) {
        const lastCard = cards[cards.length - 1];
        gsap.fromTo(lastCard,
          { y: -60, rotateY: 180, opacity: 0 },
          { y: 0, rotateY: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' }
        );
      }
    }, 0);

    const score = calculateScore(newHand);
    if (score > 21) {
      bust();
    } else if (score === 21) {
      setTimeout(() => stand(newHand, dealerHand, remainingDeck), 500);
    }
  };

  const bust = () => {
    setGameState('finished');
    setMessage('BUST!');
    // TEST MODE: No balance loss
    // setBalance(prev => prev - betAmount);
    
    soundManager?.playLose();
    shakeScreen();

    setHistory(prev => [
      { result: 'lose', playerScore: calculateScore(playerHand), dealerScore: calculateScore(dealerHand), amount: betAmount },
      ...prev.slice(0, 9)
    ]);
  };

  const stand = (pHand = playerHand, dHand = dealerHand, currentDeck = deck) => {
    setGameState('dealer');
    setShowDealerCard(true);
    setMessage('Dealer\'s turn...');
    soundManager?.playCardFlip();

    let dealerCards = [...dHand];
    let remainingDeck = [...currentDeck];

    const dealerDrawInterval = setInterval(() => {
      const dealerScore = calculateScore(dealerCards);
      
      if (dealerScore < 17) {
        const [newCard, newDeck] = dealCard(remainingDeck);
        dealerCards = [...dealerCards, newCard];
        remainingDeck = newDeck;
        setDealerHand(dealerCards);
        setDeck(newDeck);
        soundManager?.playCardFlip();
      } else {
        clearInterval(dealerDrawInterval);
        determineWinner(pHand, dealerCards);
      }
    }, 700);
  };

  const determineWinner = (pHand: Card[], dHand: Card[]) => {
    const playerScore = calculateScore(pHand);
    const dealerScore = calculateScore(dHand);

    setGameState('finished');

    let result: 'win' | 'lose' | 'push';
    let newBalance = balance;
    let winAmount = 0;

    if (dealerScore > 21) {
      setMessage('Dealer BUST! You Win!');
      winAmount = betAmount * 2;
      newBalance = balance + betAmount;
      result = 'win';
      soundManager?.playWin();
      triggerConfetti();
    } else if (playerScore > dealerScore) {
      setMessage('You Win!');
      winAmount = betAmount * 2;
      newBalance = balance + betAmount;
      result = 'win';
      soundManager?.playWin();
      triggerConfetti();
    } else if (playerScore < dealerScore) {
      setMessage('You Lose');
      // TEST MODE: No balance loss
      // newBalance = balance - betAmount;
      result = 'lose';
      soundManager?.playLose();
      shakeScreen();
    } else {
      setMessage('Push!');
      result = 'push';
      soundManager?.playClick();
    }

    setBalance(newBalance);
    setLastWin(winAmount);
    setHistory(prev => [
      { result, playerScore, dealerScore, amount: betAmount },
      ...prev.slice(0, 9)
    ]);
  };

  const shakeScreen = () => {
    if (tableRef.current) {
      gsap.to(tableRef.current, {
        x: '+=8',
        duration: 0.04,
        yoyo: true,
        repeat: 5,
        ease: 'power1.inOut',
        onComplete: () => {
          if (tableRef.current) gsap.set(tableRef.current, { x: 0 });
        }
      });
    }

    const flash = document.createElement('div');
    flash.className = 'fixed inset-0 bg-ruby/20 pointer-events-none z-50';
    document.body.appendChild(flash);
    gsap.to(flash, { opacity: 0, duration: 0.4, onComplete: () => flash.remove() });
  };

  const triggerConfetti = () => {
    const colors = ['#D4AF37', '#10B981', '#F59E0B', '#FBBF24', '#FDE68A'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: 50%;
        top: 40%;
        z-index: 9999;
        pointer-events: none;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      `;
      
      document.body.appendChild(confetti);
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 100 + Math.random() * 200;
      
      gsap.to(confetti, {
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity + 180,
        rotation: Math.random() * 400 - 200,
        opacity: 0,
        duration: 1 + Math.random() * 0.4,
        ease: 'power2.out',
        onComplete: () => confetti.remove()
      });
    }
  };

  const resetGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setDeck([]);
    setGameState('betting');
    setMessage('Place your bet');
    setShowDealerCard(false);
    setLastWin(0);
    soundManager?.playClick();
  };

  const adjustBet = (amount: number) => {
    const newBet = Math.max(0.001, Math.min(balance, betAmount + amount));
    setBetAmount(Number(newBet.toFixed(4)));
    soundManager?.playBet();
  };

  const CardComponent = ({ card, isHidden = false }: { card: Card; isHidden?: boolean }) => (
    <div className="relative flex-shrink-0" style={{ perspective: '1000px' }}>
      {isHidden ? (
        <div className="w-12 h-[68px] sm:w-14 sm:h-20 md:w-16 md:h-24 rounded-lg shadow-lg relative overflow-hidden border border-zinc-600 bg-gradient-to-br from-zinc-700 to-zinc-900">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(212,175,55,0.1) 4px, rgba(212,175,55,0.1) 8px)`
          }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-gold/40 flex items-center justify-center">
              <span className="text-gold/60 text-xs font-bold">B</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-12 h-[68px] sm:w-14 sm:h-20 md:w-16 md:h-24 bg-gradient-to-br from-white to-zinc-100 rounded-lg shadow-lg flex flex-col items-center justify-center relative overflow-hidden border border-zinc-200">
          <div className={`absolute top-1 left-1 text-[10px] sm:text-xs font-bold leading-none ${card.color === 'red' ? 'text-ruby' : 'text-zinc-900'}`}>
            {card.value}
            <div className="text-[8px] sm:text-[10px]">{card.suit}</div>
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-black ${card.color === 'red' ? 'text-ruby' : 'text-zinc-900'}`}>
            {card.suit}
          </div>
          <div className={`absolute bottom-1 right-1 text-[10px] sm:text-xs font-bold rotate-180 leading-none ${card.color === 'red' ? 'text-ruby' : 'text-zinc-900'}`}>
            {card.value}
            <div className="text-[8px] sm:text-[10px]">{card.suit}</div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  );

  const ChipComponent = ({ value, index }: { value: number; index: number }) => {
    const colors = CHIP_COLORS[value] || CHIP_COLORS[0.001];
    const displayValue = value >= 0.01 ? value.toFixed(2) : value.toFixed(3);
    return (
      <div 
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${colors.bg} ${colors.border} border-2 flex items-center justify-center font-bold ${colors.text} text-[6px] sm:text-[8px] shadow-md absolute`}
        style={{ 
          top: `-${index * 4}px`,
          transform: `rotate(${index * 10}deg)`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)'
        }}
      >
        {displayValue}
      </div>
    );
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
        
        <h1 className="text-base sm:text-lg font-semibold text-gold">Blackjack</h1>
        
        <div className="flex items-center gap-2">
          <div className="bg-bg-secondary border border-border-subtle rounded-lg px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">BAL:</span>
            <span className="counter text-xs sm:text-sm font-bold text-gold">{balance.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="lg:hidden p-1.5 rounded-lg bg-bg-secondary border border-border-subtle"
          >
            <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* History Strip - Mobile */}
      <div className="lg:hidden flex-shrink-0 px-4 py-2 border-b border-border-subtle bg-bg-secondary/50">
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {history.slice(0, 8).map((hand, index) => (
            <div
              key={index}
              className={`flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                hand.result === 'win' ? 'bg-emerald/10 text-emerald border border-emerald/20' :
                hand.result === 'lose' ? 'bg-ruby/10 text-ruby border border-ruby/20' :
                'bg-zinc-700/50 text-[var(--text-muted)] border border-border-subtle'
              }`}
            >
              <span>{hand.result === 'win' ? 'W' : hand.result === 'lose' ? 'L' : 'P'}</span>
              <span className="text-[var(--text-muted)]">{hand.playerScore}v{hand.dealerScore}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Game Column */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Table */}
          <div 
            ref={tableRef}
            className="flex-1 min-h-0 relative rounded-xl p-4 sm:p-5 flex flex-col border border-emerald-900/40"
            style={{
              background: 'linear-gradient(145deg, #0d4a2f 0%, #0a3d26 50%, #07301d 100%)',
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.08), inset 0 0 60px rgba(0,0,0,0.25)',
              minHeight: '280px',
              maxHeight: '400px'
            }}
          >
            {/* Table edge */}
            <div className="absolute inset-2 border border-emerald-800/25 rounded-lg pointer-events-none" />
            
            {/* Dealer Hand */}
            <div className="flex-shrink-0 text-center mb-2">
              <h3 className="text-[10px] sm:text-xs font-medium text-white/70 uppercase tracking-wider mb-1">Dealer</h3>
              {gameState !== 'betting' && (
                <span className="counter text-base sm:text-lg font-bold text-gold bg-black/30 px-2 py-0.5 rounded">
                  {showDealerCard ? calculateScore(dealerHand) : dealerHand[0]?.numericValue || '?'}
                </span>
              )}
              <div className="flex justify-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                {dealerHand.map((card, index) => (
                  <CardComponent key={index} card={card} isHidden={index === 1 && !showDealerCard} />
                ))}
              </div>
            </div>

            {/* Center Message */}
            <div className="flex-1 flex flex-col items-center justify-center py-2">
              <div 
                className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wide" 
                style={{ 
                  color: gameState === 'finished' && message.includes('Win') ? 'var(--emerald)' :
                         gameState === 'finished' && (message.includes('Lose') || message.includes('BUST')) ? 'var(--ruby)' :
                         'var(--gold)',
                }}
              >
                {message}
              </div>
              
              {lastWin > 0 && (
                <div className="counter text-base sm:text-lg font-bold text-emerald mt-1 animate-pulse">
                  +{lastWin} MON
                </div>
              )}
              
              {gameState === 'betting' && chipStack.length > 0 && (
                <div ref={chipStackRef} className="relative h-12 sm:h-14 flex items-end justify-center mt-2">
                  {chipStack.slice(0, 8).map((chip, i) => (
                    <ChipComponent key={i} value={chip} index={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Player Hand */}
            <div className="flex-shrink-0 text-center mt-2">
              <div className="flex justify-center gap-1.5 sm:gap-2 mb-2 flex-wrap" ref={playerCardsRef}>
                {playerHand.map((card, index) => (
                  <CardComponent key={index} card={card} />
                ))}
              </div>
              {gameState !== 'betting' && (
                <span className={`counter text-base sm:text-lg font-bold px-2 py-0.5 rounded ${
                  calculateScore(playerHand) > 21 ? 'text-ruby bg-ruby/20' :
                  calculateScore(playerHand) === 21 ? 'text-emerald bg-emerald/20' :
                  'text-gold bg-black/30'
                }`}>
                  {calculateScore(playerHand)}
                </span>
              )}
              <h3 className="text-[10px] sm:text-xs font-medium text-white/70 uppercase tracking-wider mt-1">Your Hand</h3>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bet Input */}
            <div className="card p-3 sm:p-4">
              <label className="block text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 font-medium">
                Bet Amount
              </label>
              
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[0.001, 0.005, 0.01, 0.05].map(amount => (
                  <button
                    key={amount}
                    onClick={() => { setBetAmount(amount); soundManager?.playBet(); }}
                    disabled={gameState !== 'betting' || amount > balance}
                    className={`py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-xs transition-all ${
                      betAmount === amount 
                        ? 'bg-gold text-bg-primary' 
                        : 'bg-bg-secondary text-[var(--text-secondary)] border border-border-subtle hover:border-gold/30'
                    } disabled:opacity-40`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustBet(-0.005)}
                  disabled={gameState !== 'betting' || betAmount <= 0.001}
                  className="w-9 h-9 rounded-lg bg-bg-secondary border border-border-subtle text-[var(--text-secondary)] text-lg font-bold hover:border-gold/30 hover:text-gold transition-all disabled:opacity-40"
                >
                  -
                </button>
                <div className="flex-1 bg-bg-secondary border border-border-subtle rounded-lg px-3 py-2 text-center">
                  <span className="counter text-base sm:text-lg font-bold text-gold">{betAmount.toFixed(4)}</span>
                </div>
                <button
                  onClick={() => adjustBet(0.005)}
                  disabled={gameState !== 'betting' || betAmount >= balance}
                  className="w-9 h-9 rounded-lg bg-bg-secondary border border-border-subtle text-[var(--text-secondary)] text-lg font-bold hover:border-gold/30 hover:text-gold transition-all disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col justify-center gap-2">
              {gameState === 'betting' && (
                <button
                  onClick={startGame}
                  disabled={betAmount > balance}
                  className="btn-primary py-3 sm:py-4 text-sm sm:text-base disabled:opacity-40"
                >
                  <span>Deal Cards</span>
                </button>
              )}

              {gameState === 'playing' && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={hit} className="btn-primary py-3 text-sm sm:text-base">
                    Hit
                  </button>
                  <button onClick={() => stand()} className="btn-secondary py-3 text-sm sm:text-base">
                    Stand
                  </button>
                </div>
              )}

              {gameState === 'dealer' && (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-gold border-t-transparent rounded-full mx-auto" />
                </div>
              )}

              {gameState === 'finished' && (
                <button onClick={resetGame} className="btn-primary py-3 text-sm sm:text-base">
                  <span>New Hand</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="card p-3 sticky top-20">
            <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </h3>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {history.map((hand, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-2 text-xs border ${
                    hand.result === 'win' ? 'bg-emerald/5 border-emerald/20' :
                    hand.result === 'lose' ? 'bg-ruby/5 border-ruby/20' :
                    'bg-bg-secondary border-border-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-semibold uppercase text-[10px] ${
                      hand.result === 'win' ? 'text-emerald' :
                      hand.result === 'lose' ? 'text-ruby' :
                      'text-[var(--text-muted)]'
                    }`}>
                      {hand.result === 'win' ? 'WIN' : hand.result === 'lose' ? 'LOSS' : 'PUSH'}
                    </span>
                    <span className={`text-[10px] font-semibold ${
                      hand.result === 'win' ? 'text-emerald' :
                      hand.result === 'lose' ? 'text-ruby' :
                      'text-[var(--text-muted)]'
                    }`}>
                      {hand.result === 'win' ? '+' : hand.result === 'lose' ? '-' : ''}{hand.amount} MON
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] flex justify-between">
                    <span>You: {hand.playerScore}</span>
                    <span>Dealer: {hand.dealerScore}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Stats */}
            <div className="mt-3 pt-2 border-t border-border-subtle">
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="bg-bg-secondary rounded-lg p-2 text-center">
                  <div className="text-[var(--text-muted)] text-[10px]">Wins</div>
                  <div className="text-emerald font-bold">{history.filter(h => h.result === 'win').length}</div>
                </div>
                <div className="bg-bg-secondary rounded-lg p-2 text-center">
                  <div className="text-[var(--text-muted)] text-[10px]">Losses</div>
                  <div className="text-ruby font-bold">{history.filter(h => h.result === 'lose').length}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile History Panel */}
      {showHistory && (
        <div className="lg:hidden fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-sm animate-fade-in">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">History</h3>
              <button onClick={() => setShowHistory(false)} className="p-2">
                <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {history.map((hand, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 border ${
                    hand.result === 'win' ? 'bg-emerald/5 border-emerald/20' :
                    hand.result === 'lose' ? 'bg-ruby/5 border-ruby/20' :
                    'bg-bg-secondary border-border-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold uppercase text-sm ${
                      hand.result === 'win' ? 'text-emerald' :
                      hand.result === 'lose' ? 'text-ruby' :
                      'text-[var(--text-muted)]'
                    }`}>
                      {hand.result === 'win' ? 'WIN' : hand.result === 'lose' ? 'LOSS' : 'PUSH'}
                    </span>
                    <span className={`text-sm font-semibold ${
                      hand.result === 'win' ? 'text-emerald' :
                      hand.result === 'lose' ? 'text-ruby' :
                      'text-[var(--text-muted)]'
                    }`}>
                      {hand.result === 'win' ? '+' : hand.result === 'lose' ? '-' : ''}{hand.amount} MON
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] flex justify-between">
                    <span>You: {hand.playerScore}</span>
                    <span>Dealer: {hand.dealerScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
