import { RotateCcw, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui';

type Accent = 'arif' | 'roaya';

const ACCENT_BORDER: Record<Accent, string> = {
  arif: 'border-arif/45',
  roaya: 'border-roaya/45',
};
const ACCENT_NAME: Record<Accent, string> = {
  arif: 'text-arif-fg',
  roaya: 'text-roaya-fg',
};

type MessageBubbleProps = {
  role: 'user' | 'assistant';
  /** Display name shown above the bubble */
  author: string;
  /** Pre-formatted, localized time */
  time: string;
  /** Avatar element (user avatar or CharacterAvatar) — passed in to keep entities decoupled */
  avatar: ReactNode;
  /** Assistant accent (character identity) */
  accent?: Accent;
  status?: 'done' | 'error';
  onRetry?: () => void;
  /** Controls under the bubble, e.g. the listen/speaker button for assistant messages */
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * One chat message. Users sit at the inline-end, the assistant at the inline-start,
 * which mirrors automatically between Arabic and English. AI text uses dir="auto"
 * so mixed Arabic/English content wraps correctly.
 */
export function MessageBubble({
  role,
  author,
  time,
  avatar,
  accent = 'arif',
  status = 'done',
  onRetry,
  footer,
  children,
}: MessageBubbleProps) {
  const t = useTranslations('chat');
  const isUser = role === 'user';

  return (
    <article
      className={cn('flex w-full gap-3', isUser && 'flex-row-reverse')}
      aria-label={t('messageFrom', { author })}
    >
      <div className="pt-6">{avatar}</div>
      <div className={cn('flex max-w-[min(42rem,85%)] min-w-0 flex-col gap-1', isUser && 'items-end')}>
        <p className="flex items-baseline gap-2 px-1">
          <span className={cn('text-sm font-bold', isUser ? 'text-fg' : ACCENT_NAME[accent])}>{author}</span>
          <time className="type-caption text-fg-muted tabular-nums">{time}</time>
        </p>
        <div
          dir="auto"
          className={cn(
            'type-body w-fit max-w-full rounded-xl px-4 py-3 break-words [&_ol]:list-decimal [&_ol]:ps-5 [&_p+p]:mt-2 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:ps-5 [&>*+ol]:mt-2 [&>*+ul]:mt-2',
            isUser
              ? 'bg-surface-muted text-fg rounded-se-sm'
              : ['bg-surface text-fg rounded-ss-sm border', ACCENT_BORDER[accent]],
            status === 'error' && 'border-error/50 bg-error-tint border',
          )}
        >
          {children}
        </div>
        {footer && <div className="-ms-1.5 flex items-center">{footer}</div>}
        {status === 'error' && (
          <div className="flex items-center gap-2 px-1" role="alert">
            <TriangleAlert className="text-error-fg size-4" aria-hidden />
            <span className="type-body-sm text-error-fg">{t('sendFailed')}</span>
            {onRetry && (
              <Button variant="link" size="sm" className="text-sm" onClick={onRetry}>
                <RotateCcw aria-hidden />
                {t('retry')}
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
