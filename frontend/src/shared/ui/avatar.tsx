import { Avatar as AvatarPrimitive } from 'radix-ui';
import { cn } from '@/shared/lib';

type AvatarProps = {
  src?: string;
  alt: string;
  /** Fallback initials when there is no image */
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Character ring (assistant identity) */
  ring?: 'arif' | 'roaya' | 'brand' | 'none';
  /** Focus point of the image inside the circle, e.g. 'center 15%' for head-and-shoulders crops */
  objectPosition?: string;
  className?: string;
};

const SIZES = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-base', xl: 'size-20 text-lg' };
const RINGS = {
  arif: 'ring-2 ring-arif ring-offset-2 ring-offset-surface',
  roaya: 'ring-2 ring-roaya ring-offset-2 ring-offset-surface',
  brand: 'ring-2 ring-primary ring-offset-2 ring-offset-surface',
  none: '',
};

export function Avatar({
  src,
  alt,
  initials,
  size = 'md',
  ring = 'none',
  objectPosition = 'center',
  className,
}: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'bg-surface-brand relative inline-flex shrink-0 overflow-hidden rounded-full',
        SIZES[size],
        RINGS[ring],
        className,
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={alt}
          className="size-full object-cover"
          style={{ objectPosition }}
        />
      )}
      <AvatarPrimitive.Fallback
        className="text-primary grid size-full place-items-center font-bold"
        aria-label={alt}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
