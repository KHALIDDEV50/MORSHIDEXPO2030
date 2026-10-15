import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { SignInSheetHost } from '@/features/auth';
import { BottomNav } from './bottom-nav';
import { DemoProfileFromUrl } from './demo-profile-from-url';
import { NavRail } from './nav-rail';
import { ShellFrame } from './shell-frame';
import { TopBar } from './top-bar';

/**
 * Application shell (Phase 3, Gate D): collapsible rail on ≥768px, bottom navigation on phones,
 * sticky top bar, and a main area whose inline-start padding follows the rail width
 * (same `data-sidebar` source), so fixed navigation never covers content.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations('shell');
  return (
    <ShellFrame>
      <a
        href="#main-content"
        className="focus-ring bg-surface-elevated text-fg z-tooltip fixed start-3 top-3 -translate-y-20 rounded-md px-4 py-2 text-sm font-bold shadow-lg transition-transform focus:translate-y-0"
      >
        {t('skipToContent')}
      </a>
      <NavRail />
      <div className="flex min-h-dvh flex-col transition-[padding] duration-300 ease-standard motion-reduce:transition-none md:ps-20 md:group-data-[sidebar=expanded]/shell:ps-60 xl:group-data-[sidebar=auto]/shell:ps-60">
        <TopBar />
        <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] outline-none md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
      <DemoProfileFromUrl />
      {/* Answers requestSignIn() from any gated action (guest save → sign in → completes) */}
      <SignInSheetHost />
    </ShellFrame>
  );
}
