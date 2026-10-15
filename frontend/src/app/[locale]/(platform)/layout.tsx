import type { ReactNode } from 'react';
import { AppShell } from '@/widgets/app-shell';
import { resolveLocale, type LocaleParams } from './route-helpers';

/** Every top-level destination renders inside the application shell (Phase 3). */
export default async function PlatformLayout({ children, params }: LocaleParams & { children: ReactNode }) {
  await resolveLocale(params);
  return <AppShell>{children}</AppShell>;
}
