import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib';
import { CHARACTERS, type CharacterId } from '../model/characters';
import { CharacterAvatar } from './character-avatar';

/**
 * Character-selection card (radio semantics): use inside an element with role="radiogroup".
 * Name and role are localized text; the accent appears on the selected card only.
 */
export function CharacterCard({
  id,
  selected,
  onSelect,
  layout = 'vertical',
  className,
}: {
  id: CharacterId;
  selected: boolean;
  onSelect: (id: CharacterId) => void;
  /** vertical: picker grid · horizontal: compact list / sheet */
  layout?: 'vertical' | 'horizontal';
  className?: string;
}) {
  const t = useTranslations('characters');
  const accent = CHARACTERS[id].accent;
  const vertical = layout === 'vertical';

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(id)}
      className={cn(
        'focus-ring border-border bg-surface relative flex cursor-pointer rounded-xl border text-start transition-[border-color,box-shadow,background-color,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:hover:translate-y-0',
        vertical ? 'flex-col items-center gap-3 p-5 text-center' : 'items-center gap-3.5 p-3.5',
        selected ? cn('shadow-sm', accent.border, accent.tint) : 'hover:border-border-strong',
        className,
      )}
    >
      <CharacterAvatar id={id} size={vertical ? 'xl' : 'lg'} selected={selected} ring={selected} decorative />
      <span className={cn('flex min-w-0 flex-col gap-0.5', vertical && 'items-center')}>
        <span className={cn('font-display text-lg leading-tight font-bold', selected ? accent.text : 'text-fg')}>{t(`${id}.name`)}</span>
        <span className="type-caption text-fg-secondary">{t(`${id}.role`)}</span>
      </span>
      <span
        className={cn(
          'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
          vertical ? 'absolute end-3 top-3' : 'ms-auto',
          selected ? cn('border-transparent text-white', accent.bg) : 'border-border-strong text-transparent',
        )}
        aria-hidden
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    </button>
  );
}
