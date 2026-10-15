'use client';

import { ChevronDown, Coins, CreditCard, LogIn, LogOut, Settings } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { effectivePlanId, useSubscriptionSnapshot } from '@/entities/subscription';
import { displayName, initials, useCurrentUser } from '@/entities/user';
import { useState } from 'react';
import { LanguageSubmenu } from '@/features/switch-language';
import { ThemeSubmenu } from '@/features/switch-theme';
import { authRepository } from '@/features/auth';
import { Link, usePathname, useRouter } from '@/shared/i18n';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from '@/shared/ui';

/**
 * Account menu. Phones (approved, unchanged): avatar-only trigger. Desktop (≥768px, Gate D
 * refinement): horizontal trigger — avatar, name, plan underneath, chevron — and the menu also
 * holds the language and theme switches (removed from the desktop header).
 * Who is signed in comes from the session (today: the demo subscription store); the name from
 * the user entity — nothing is hardcoded here.
 */
export function UserMenu() {
  const t = useTranslations('shell.user');
  const ts = useTranslations('subscription');
  const locale = useLocale();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { subscription, balance } = useSubscriptionSnapshot();
  const guest = subscription === null;
  const profile = useCurrentUser();
  const user = guest ? null : profile;
  const router = useRouter();
  const pathname = usePathname();
  const name = user ? displayName(user, locale) : t('guest');
  const plan = effectivePlanId(subscription);
  const planLabel = guest ? t('guestNote') : ts(`plans.${plan ?? 'free'}.name`);
  // Single source for the nested submenus: at most one can be open at a time
  const [openSub, setOpenSub] = useState<'language' | 'theme' | null>(null);
  const toggleSub = (which: 'language' | 'theme', open: boolean) =>
    setOpenSub((current) => (open ? which : current === which ? null : current));

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        // Closing the account menu for any reason closes and resets every submenu
        if (!open) setOpenSub(null);
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('menuFor', { name, plan: planLabel })}
          className="focus-ring hover:bg-surface-muted flex shrink-0 cursor-pointer items-center gap-2.5 rounded-full transition-colors md:border md:border-border md:py-1 md:ps-1 md:pe-3"
        >
          <Avatar
            src={user?.avatarUrl ?? undefined}
            alt=""
            initials={user ? initials(name) : '?'}
            size="md"
            ring={guest ? 'none' : 'brand'}
            className="md:size-9"
          />
          <span className="hidden min-w-0 flex-col text-start leading-tight md:flex">
            <span className="text-fg max-w-40 truncate text-sm font-bold">{name}</span>
            <span className="text-fg-muted max-w-40 truncate text-xs">{planLabel}</span>
          </span>
          <ChevronDown className="text-fg-muted hidden size-4 shrink-0 md:block" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-fg text-sm font-bold">{name}</span>
          <span>{guest ? t('guestNote') : t('planLine', { plan: planLabel })}</span>
        </DropdownMenuLabel>
        <div className="text-fg-secondary flex items-center gap-2 px-3 pb-2 text-xs">
          <Coins className="size-3.5" aria-hidden />
          {ts('credits.remainingOf', { remaining: balance.remaining, allowance: balance.allowance })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden />
            {t('settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings#subscription">
            <CreditCard aria-hidden />
            {t('subscription')}
          </Link>
        </DropdownMenuItem>
        {isDesktop && (
          <>
            <DropdownMenuSeparator />
            <LanguageSubmenu open={openSub === 'language'} onOpenChange={(o) => toggleSub('language', o)} />
            <ThemeSubmenu open={openSub === 'theme'} onOpenChange={(o) => toggleSub('theme', o)} />
          </>
        )}
        {guest && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}>
              <LogIn className="flip-rtl" aria-hidden />
              {t('signIn')}
            </DropdownMenuItem>
          </>
        )}
        {!guest && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                void authRepository.logout().then(() => {
                  toast(t('signedOutToast'));
                  router.push('/chat');
                })
              }
            >
              <LogOut className="flip-rtl" aria-hidden />
              {t('signOut')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
