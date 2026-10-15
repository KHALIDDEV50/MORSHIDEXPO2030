'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { useMediaQuery } from './use-media-query';

/** True when the visitor allows motion (`prefers-reduced-motion: no-preference`). False on the server. */
export function useMotionAllowed(): boolean {
  return useMediaQuery('(prefers-reduced-motion: no-preference)');
}

/**
 * True once the element has entered the viewport. With `once: false` it follows the element in
 * and out. Only drives animation: callers must render meaningful content while it is false.
 */
export function useInView<T extends Element>({ once = true, rootMargin = '0px 0px -15% 0px', threshold = 0 }: { once?: boolean; rootMargin?: string; threshold?: number } = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) setInView(false);
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);
  return [ref, inView];
}

/**
 * Sparing parallax: sets `--parallax` (px) on the element while it is on screen, proportional to
 * its distance from the viewport centre. Pair with the `data-parallax` attribute (globals.css),
 * which only applies the offset when motion is allowed. One passive scroll listener, rAF-throttled.
 */
export function useParallax<T extends HTMLElement>(strength = 0.08): RefObject<T | null> {
  const ref = useRef<T>(null);
  const motion = useMotionAllowed();
  useEffect(() => {
    const el = ref.current;
    if (!el || !motion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -strength;
      el.style.setProperty('--parallax', offset.toFixed(1));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
      el.style.removeProperty('--parallax');
    };
  }, [motion, strength]);
  return ref;
}

/** True once the page has scrolled past `threshold` pixels (for headers that turn solid). */
export function useScrolledPast(threshold = 24): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('scroll', onChange, { passive: true });
    return () => window.removeEventListener('scroll', onChange);
  }, []);
  return useSyncExternalStore(subscribe, () => window.scrollY > threshold, () => false);
}
