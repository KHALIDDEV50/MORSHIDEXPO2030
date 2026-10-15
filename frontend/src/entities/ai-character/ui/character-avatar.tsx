import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib';
import { CHARACTERS, type CharacterId } from '../model/characters';

/**
 * Avatar sizes by context (design-system.md §14):
 * xs 24 compact lists · sm 32 message bubbles · md 40 chat header · lg 56 cards ·
 * xl 80 selection cards · 2xl 112 profile/selection hero
 */
const SIZES = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-20',
  '2xl': 'size-28',
} as const;

const RING_WIDTH = { xs: 'ring-1 ring-offset-1', sm: 'ring-2 ring-offset-1', md: 'ring-2 ring-offset-2', lg: 'ring-2 ring-offset-2', xl: 'ring-[3px] ring-offset-2', '2xl': 'ring-[3px] ring-offset-[3px]' } as const;

const GLOW = { arif: 'shadow-[0_0_0_4px_var(--arif-tint),0_6px_20px_-4px_var(--arif)]', roaya: 'shadow-[0_0_0_4px_var(--roaya-tint),0_6px_20px_-4px_var(--roaya)]' } as const;

/**
 * Circular head-and-shoulders avatar cropped from the full-body art (no separate asset, never stretched:
 * `object-cover` + a per-character focus point). The accent ring identifies the character;
 * `selected` adds a soft accent halo; `speaking` shows a small live dot.
 */
export function CharacterAvatar({
  id,
  size = 'md',
  ring = true,
  selected = false,
  speaking = false,
  decorative = false,
  className,
}: {
  id: CharacterId;
  size?: keyof typeof SIZES;
  ring?: boolean;
  /** Selected in a character picker */
  selected?: boolean;
  /** Assistant is currently speaking / responding */
  speaking?: boolean;
  /** When the name is already shown next to the avatar */
  decorative?: boolean;
  className?: string;
}) {
  const t = useTranslations('characters');
  const { fullImage, avatarFocus, accent } = CHARACTERS[id];

  return (
    <span className={cn('relative inline-flex shrink-0', SIZES[size], className)}>
      <span
        className={cn(
          'relative size-full overflow-hidden rounded-full bg-radial from-surface to-transparent to-90%',
          accent.tint,
          ring && ['ring-offset-surface', RING_WIDTH[size], accent.ring],
          selected && GLOW[id],
          'transition-shadow duration-200',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- CSS crop of a local asset */}
        <img
          src={fullImage}
          alt={decorative ? '' : t(`${id}.name`)}
          className="absolute inset-0 size-full object-cover"
          style={{
            objectPosition: `${avatarFocus.x} ${avatarFocus.objectY}`,
            transform: `scale(${avatarFocus.scale})`,
            transformOrigin: `${avatarFocus.x} ${avatarFocus.originY}`,
          }}
          draggable={false}
        />
      </span>
      {speaking && (
        <span className="absolute -end-0.5 -bottom-0.5 flex size-3" aria-hidden>
          <span className={cn('absolute inset-0 rounded-full opacity-70 motion-safe:animate-ping', accent.bg)} />
          <span className={cn('ring-surface relative size-3 rounded-full ring-2', accent.bg)} />
        </span>
      )}
    </span>
  );
}
