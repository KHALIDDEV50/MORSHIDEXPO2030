'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { cn } from '@/shared/lib';

export type RevealVariant = 'rise' | 'clip' | 'scale' | 'fade';

/**
 * Subtle scroll reveal. Content is fully visible without JavaScript and for reduced-motion users
 * (the CSS only animates under `prefers-reduced-motion: no-preference`); elements already on
 * screen when the page loads are never hidden.
 * Variants: `rise` (default, fades up), `clip` (an image unveils from its bottom edge),
 * `scale` (settles from a slight zoom), `fade`.
 */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  variant = 'rise',
  className,
  children,
  ...props
}: {
  as?: ElementType;
  delay?: number;
  variant?: RevealVariant;
  className?: string;
  children: ReactNode;
  id?: string;
  'aria-labelledby'?: string;
  'aria-label'?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return; // already visible: no effect
    el.dataset.reveal = 'hidden';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.dataset.reveal = 'shown';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(className)}
      data-reveal-variant={variant === 'rise' ? undefined : variant}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}
