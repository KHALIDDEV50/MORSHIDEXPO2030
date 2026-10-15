import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { CHARACTERS, type CharacterId } from '../model/characters';
import { CharacterAvatar } from './character-avatar';

/** Compact header shown once a conversation has started (replaces the welcome stage). */
export function AssistantHeader({
  id,
  actions,
  className,
}: {
  id: CharacterId;
  /** e.g. the character switcher */
  actions?: ReactNode;
  className?: string;
}) {
  const t = useTranslations('characters');
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        <CharacterAvatar id={id} size="md" decorative />
        <div className="flex min-w-0 flex-col">
          <p className={cn('type-h4 leading-tight', CHARACTERS[id].accent.text)}>{t(`${id}.name`)}</p>
          <p className="type-caption text-fg-muted truncate">{t(`${id}.role`)}</p>
        </div>
      </div>
      {actions}
    </div>
  );
}

const HALO: Record<CharacterId, string> = {
  arif: 'from-arif/25 via-arif-tint/60',
  roaya: 'from-roaya/25 via-roaya-tint/60',
};

/**
 * Welcome-screen character stage: the full artwork on a soft accent halo, with the brand swoosh
 * passing behind it and a grounding shadow. Purely visual — the name and greeting are real text
 * rendered by the caller.
 */
export function CharacterStage({ id, className }: { id: CharacterId; className?: string }) {
  const t = useTranslations('characters');
  const { fullImage } = CHARACTERS[id];
  return (
    <div className={cn('relative isolate grid aspect-square place-items-center', className)}>
      <div
        className={cn('absolute inset-[8%] -z-10 rounded-full bg-radial to-transparent to-70%', HALO[id])}
        aria-hidden
      />
      <div className="border-border/60 absolute inset-[14%] -z-10 rounded-full border border-dashed" aria-hidden />
      <Image
        src="/images/brand/swoosh-motif.svg"
        alt=""
        width={544}
        height={224}
        className="pointer-events-none absolute top-[38%] -z-10 w-[118%] max-w-none opacity-55"
      />
      <span className="bg-fg/10 absolute bottom-[6%] -z-10 h-[5%] w-[34%] rounded-[50%] blur-md" aria-hidden />
      <Image
        src={fullImage}
        alt={t(`${id}.alt`)}
        width={300}
        height={460}
        priority
        className="animate-float h-[92%] w-auto drop-shadow-xl"
      />
    </div>
  );
}
