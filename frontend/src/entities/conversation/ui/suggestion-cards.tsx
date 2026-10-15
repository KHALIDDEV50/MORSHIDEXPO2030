import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';

export type SuggestionCardItem = {
  key: string;
  icon: ReactNode;
  title: string;
  hint: string;
  /** Full text sent when the card is chosen */
  prompt: string;
};

type Accent = 'arif' | 'roaya';
const ICON_TINT: Record<Accent, string> = {
  arif: 'bg-arif-tint text-arif-fg',
  roaya: 'bg-roaya-tint text-roaya-fg',
};
const HOVER: Record<Accent, string> = {
  arif: 'hover:border-arif/50',
  roaya: 'hover:border-roaya/50',
};

/**
 * Welcome-screen suggestion cards. Narrow containers: a swipeable row (designed for thumbs);
 * wider: a 2-column grid; very wide: 4 columns. Choosing a card sends its prompt.
 */
export function SuggestionCards({
  items,
  accent,
  onSelect,
  className,
}: {
  items: SuggestionCardItem[];
  accent: Accent;
  onSelect: (prompt: string) => void;
  className?: string;
}) {
  const t = useTranslations('chat');
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <p className="type-caption text-fg-muted px-1">{t('suggestionsLabel')}</p>
      <ul
        className={cn(
          // Phone: horizontal snap row that bleeds to the edges
          '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none]',
          // Wider: grid
          '@2xl:mx-0 @2xl:grid @2xl:grid-cols-2 @2xl:overflow-visible @2xl:px-0 @5xl:grid-cols-4',
        )}
      >
        {items.map((item) => (
          <li key={item.key} className="w-[15.5rem] shrink-0 snap-start @2xl:w-auto">
            <button
              type="button"
              onClick={() => onSelect(item.prompt)}
              className={cn(
                'focus-ring group border-border bg-surface/80 flex h-full w-full cursor-pointer items-start gap-3 rounded-lg border p-3.5 text-start shadow-sm backdrop-blur-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md',
                HOVER[accent],
              )}
            >
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-md [&_svg]:size-5', ICON_TINT[accent])} aria-hidden>
                {item.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-fg text-[0.9375rem] leading-snug font-bold">{item.title}</span>
                <span className="type-caption text-fg-muted">{item.hint}</span>
              </span>
              <ArrowUpRight
                className="text-fg-muted group-hover:text-fg mt-0.5 size-4 shrink-0 transition-colors rtl:-scale-x-100"
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
