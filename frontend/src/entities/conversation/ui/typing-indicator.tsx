import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

/** "Arif is typing…" — three dots with a gentle pulse (static under reduced motion). */
export function TypingIndicator({ author, avatar }: { author: string; avatar: ReactNode }) {
  const t = useTranslations('chat');
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      {avatar}
      <div className="border-border bg-surface flex items-center gap-1.5 rounded-xl rounded-ss-sm border px-4 py-3.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="bg-cta size-2 animate-pulse rounded-full"
            style={{ animationDelay: `${delay}ms` }}
            aria-hidden
          />
        ))}
        <span className="sr-only">{t('typing', { author })}</span>
      </div>
    </div>
  );
}
