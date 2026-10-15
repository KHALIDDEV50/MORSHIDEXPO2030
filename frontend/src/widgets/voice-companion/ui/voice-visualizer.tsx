'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { cn } from '@/shared/lib';
import type { VoicePhase } from '../model/use-voice-conversation';

const BARS = 29;
const CENTER = (BARS - 1) / 2;

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false);
}

/**
 * Sound orb + symmetric bars. While listening the bars follow the real microphone level;
 * while speaking they follow a gentle synthetic rhythm (browser speech exposes no audio levels),
 * and freeze when paused. Decorative only — the phase is announced as text elsewhere.
 */
export function VoiceVisualizer({
  phase,
  levels,
  accent,
  className,
}: {
  phase: VoicePhase;
  /** Recent microphone levels 0..1 (listening only) */
  levels: number[] | null;
  accent: 'arif' | 'roaya';
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [tick, setTick] = useState(0);
  const raf = useRef(0);
  const animate = !reduced && (phase === 'speaking' || phase === 'thinking');

  useEffect(() => {
    if (!animate) return;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 60) {
        last = t;
        setTick((n) => n + 1);
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [animate]);

  const mic = levels ?? [];
  const micLevel = mic.length ? mic.reduce((a, b) => a + b, 0) / mic.length : 0;

  const heightFor = (i: number) => {
    const distance = Math.abs(i - CENTER) / CENTER; // 0 center → 1 edges
    const envelope = 1 - distance * 0.75;
    switch (phase) {
      case 'listening': {
        // Mirror the most recent mic levels outward from the center
        const level = mic[mic.length - 1 - Math.round(Math.abs(i - CENTER))] ?? 0;
        return 0.12 + level * envelope * 0.95;
      }
      case 'speaking': {
        if (reduced) return 0.35 * envelope + 0.1;
        const wave = Math.sin(tick / 2.2 + i * 0.55) * 0.5 + 0.5;
        const pulse = Math.sin(tick / 5.3 + i * 0.21) * 0.5 + 0.5;
        return 0.14 + envelope * (0.35 * wave + 0.4 * pulse);
      }
      case 'thinking':
        return 0.12 + envelope * 0.18 * (reduced ? 1 : Math.sin(tick / 3 - i * 0.4) * 0.5 + 0.5);
      case 'paused':
        return 0.1 + envelope * 0.12;
      default:
        return 0.08 + envelope * 0.08;
    }
  };

  const orbScale = phase === 'listening' ? 1 + micLevel * 0.35 : phase === 'speaking' && !reduced ? 1.04 + 0.05 * Math.sin(tick / 3) : 1;
  const active = phase === 'listening' || phase === 'speaking';

  return (
    <div className={cn('relative flex flex-col items-center', className)} aria-hidden>
      {/* Orb: blurred brand gradient that breathes with the voice */}
      <div className="relative grid h-24 w-56 place-items-center">
        <span
          className={cn(
            'absolute size-24 rounded-full blur-2xl transition-[opacity,transform] duration-300',
            phase === 'listening' ? 'bg-brand-blue' : 'bg-brand-gradient',
            active ? 'opacity-70' : phase === 'thinking' ? 'opacity-45' : 'opacity-25',
          )}
          style={{ transform: `scale(${orbScale})` }}
        />
        <span
          className={cn(
            'absolute size-14 rounded-full opacity-90 transition-transform duration-200',
            accent === 'arif' ? 'bg-arif/40' : 'bg-roaya/40',
            phase === 'thinking' && !reduced && 'animate-spin [background:conic-gradient(from_0deg,#59b6f9,#f842e2,#59b6f9)] opacity-50 blur-md',
          )}
          style={{ transform: `scale(${orbScale})` }}
        />
        <div className="relative flex h-16 items-center gap-[3px]">
          {Array.from({ length: BARS }, (_, i) => (
            <span
              key={i}
              className={cn(
                'w-[4px] rounded-full transition-[height,opacity] duration-100',
                phase === 'listening' ? 'bg-brand-blue' : 'bg-cta',
                phase === 'paused' || phase === 'idle' || phase === 'review' || phase === 'error' ? 'opacity-40' : 'opacity-95',
              )}
              style={{ height: `${Math.round(Math.min(1, heightFor(i)) * 100)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
