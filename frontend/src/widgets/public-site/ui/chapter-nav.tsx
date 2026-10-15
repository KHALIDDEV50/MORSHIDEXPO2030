'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib';

/**
 * Sticky in-page chapter navigation (scroll-spy). Plain anchor links, so it works without
 * JavaScript; the active chapter is highlighted while scrolling. Scrolls horizontally on phones.
 */
export function ChapterNav({ label, chapters }: { label: string; chapters: { id: string; label: string }[] }) {
  const [active, setActive] = useState<string | null>(null);
  const ids = chapters.map((c) => c.id).join(' ');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    ids.split(' ').forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);

  return (
    <nav aria-label={label} className="glass border-border sticky top-[calc(4rem+env(safe-area-inset-top,0px))] z-20 border-y sm:top-[calc(4.5rem+env(safe-area-inset-top,0px))]">
      <ul className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6">
        {chapters.map((c, i) => (
          <li key={c.id} className="shrink-0">
            <a
              href={`#${c.id}`}
              aria-current={active === c.id ? 'location' : undefined}
              className={cn(
                'focus-ring inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors',
                active === c.id ? 'bg-primary-tint text-primary' : 'text-fg-secondary hover:text-fg hover:bg-surface-muted',
              )}
            >
              <span className="text-fg-muted text-xs tabular-nums" dir="ltr">
                {String(i + 1).padStart(2, '0')}
              </span>
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
