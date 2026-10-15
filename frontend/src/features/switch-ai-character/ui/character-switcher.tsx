'use client';

import { ArrowLeftRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CharacterAvatar, otherCharacter, type CharacterId } from '@/entities/ai-character';
import { cn } from '@/shared/lib';

/**
 * "Switch to Roaya ⇆" pill (reference Screen 1). Shows the *other* character so the action is explicit.
 * The ⇆ icon is reserved for this action (D-010).
 */
export function CharacterSwitcher({
  active,
  onSwitch,
  className,
}: {
  active: CharacterId;
  onSwitch: (next: CharacterId) => void;
  className?: string;
}) {
  const t = useTranslations('characters');
  const next = otherCharacter(active);
  const nextName = t(`${next}.name`);

  return (
    <button
      type="button"
      onClick={() => onSwitch(next)}
      aria-label={t('switchTo', { name: nextName })}
      className={cn(
        'focus-ring border-border bg-surface text-fg hover:bg-surface-muted inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border ps-1.5 pe-3.5 text-sm font-medium shadow-sm transition-colors',
        className,
      )}
    >
      <CharacterAvatar id={next} size="sm" ring={false} decorative className="size-7" />
      <span className="hidden sm:inline">{t('switchTo', { name: nextName })}</span>
      <span className="sm:hidden">{nextName}</span>
      <ArrowLeftRight className="text-fg-muted size-4" aria-hidden />
    </button>
  );
}
