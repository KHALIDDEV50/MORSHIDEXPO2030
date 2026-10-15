import type { ReactNode } from 'react';
import { PublicShell } from '@/widgets/public-site';
import { resolveLocale, type LocaleParams } from './route-helpers';

/** Public website pages share their own header and footer (not the product's AppShell). */
export default async function PublicLayout({ children, params }: LocaleParams & { children: ReactNode }) {
  await resolveLocale(params);
  return <PublicShell>{children}</PublicShell>;
}
