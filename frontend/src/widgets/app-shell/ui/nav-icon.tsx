import { CalendarDays, Compass, MessageCircle, Sparkles, Ticket, User } from 'lucide-react';
import { cn } from '@/shared/lib';
import type { NavKey } from '../model/nav-items';

/**
 * Navigation icons (D-010). Chat is a speech bubble with a small sparkle; the ⇆ icon stays
 * reserved for "switch character".
 */
export function NavIcon({ name, className }: { name: NavKey; className?: string }) {
  const cls = cn('size-[1.375rem]', className);
  switch (name) {
    case 'chat':
      return (
        <span className="relative inline-flex" aria-hidden>
          <MessageCircle className={cls} strokeWidth={1.75} />
          <Sparkles className="absolute -end-1.5 -top-1 size-3" strokeWidth={2.25} />
        </span>
      );
    case 'discover':
      return <Compass className={cls} strokeWidth={1.75} aria-hidden />;
    case 'expo':
      return <Ticket className={cls} strokeWidth={1.75} aria-hidden />;
    case 'plans':
      return <CalendarDays className={cls} strokeWidth={1.75} aria-hidden />;
    case 'profile':
      return <User className={cls} strokeWidth={1.75} aria-hidden />;
  }
}
