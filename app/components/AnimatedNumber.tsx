'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
  color?: 'gold' | 'emerald' | 'ruby' | 'sapphire' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  glow?: boolean;
}

const colorClasses = {
  gold: 'text-gold',
  emerald: 'text-emerald',
  ruby: 'text-ruby',
  sapphire: 'text-sapphire',
  white: 'text-text-primary',
};

const glowStyles = {
  gold: '0 0 12px rgba(212, 175, 55, 0.4)',
  emerald: '0 0 12px rgba(16, 185, 129, 0.4)',
  ruby: '0 0 12px rgba(239, 68, 68, 0.4)',
  sapphire: '0 0 12px rgba(59, 130, 246, 0.4)',
  white: 'none',
};

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
  '2xl': 'text-7xl',
};

export default function AnimatedNumber({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  duration = 0.5,
  color = 'gold',
  size = 'lg',
  glow = false,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current === value) return;

    const startValue = prevValueRef.current;
    const endValue = value;
    
    // Animate the number
    const obj = { val: startValue };
    gsap.to(obj, {
      val: endValue,
      duration: duration,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayValue(obj.val);
      },
    });

    // Scale pop effect on change
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { scale: 1.05 },
        { scale: 1, duration: 0.25, ease: 'power2.out' }
      );
    }

    prevValueRef.current = value;
  }, [value, duration]);

  return (
    <div
      ref={containerRef}
      className={`font-mono font-bold tabular-nums ${colorClasses[color]} ${sizeClasses[size]} ${className}`}
      style={{
        textShadow: glow ? glowStyles[color] : 'none',
      }}
    >
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </div>
  );
}

// Slot Machine style number display
interface SlotNumberProps {
  value: number;
  className?: string;
  color?: 'gold' | 'emerald' | 'ruby' | 'sapphire' | 'white';
}

export function SlotNumber({ value, className = '', color = 'gold' }: SlotNumberProps) {
  const digits = value.toFixed(2).split('');
  
  return (
    <div className={`flex items-center justify-center gap-0.5 ${className}`}>
      {digits.map((digit, index) => (
        <SlotDigit key={index} digit={digit} delay={index * 0.05} color={color} />
      ))}
    </div>
  );
}

function SlotDigit({ digit, delay, color }: { digit: string; delay: number; color: string }) {
  const digitRef = useRef<HTMLDivElement>(null);
  const prevDigitRef = useRef(digit);

  useEffect(() => {
    if (prevDigitRef.current === digit || digit === '.' || digit === ',') {
      prevDigitRef.current = digit;
      return;
    }

    if (digitRef.current) {
      // Roll animation
      gsap.fromTo(digitRef.current,
        { y: -15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.2, delay, ease: 'power2.out' }
      );
    }

    prevDigitRef.current = digit;
  }, [digit, delay]);

  if (digit === '.' || digit === ',') {
    return (
      <div className={`${colorClasses[color as keyof typeof colorClasses]} text-3xl font-bold`}>
        {digit}
      </div>
    );
  }

  return (
    <div
      ref={digitRef}
      className={`${colorClasses[color as keyof typeof colorClasses]} text-4xl font-bold w-8 text-center font-mono`}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
        borderRadius: '4px',
      }}
    >
      {digit}
    </div>
  );
}

// Counter that increments over time (for vault total)
interface LiveCounterProps {
  initialValue: number;
  incrementPerSecond: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  color?: 'gold' | 'emerald' | 'ruby' | 'sapphire' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  glow?: boolean;
}

export function LiveCounter({
  initialValue,
  incrementPerSecond,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  color = 'gold',
  size = 'lg',
  glow = false,
}: LiveCounterProps) {
  const [value, setValue] = useState(initialValue);
  const startTimeRef = useRef(Date.now());
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setValue(initialValueRef.current + elapsed * incrementPerSecond);
    }, 50);

    return () => clearInterval(interval);
  }, [incrementPerSecond]);

  return (
    <AnimatedNumber
      value={value}
      decimals={decimals}
      prefix={prefix}
      suffix={suffix}
      className={className}
      color={color}
      size={size}
      glow={glow}
      duration={0.1}
    />
  );
}
