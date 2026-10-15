'use client';

import type { ReactNode } from 'react';
import { useSidebarPreference } from '../model/sidebar';

/**
 * Client wrapper that exposes the sidebar preference as `data-sidebar` (auto | expanded | collapsed).
 * The rail width and the content's inline-start padding are both derived from it in CSS, so they
 * always move together and nothing is covered.
 */
export function ShellFrame({ children }: { children: ReactNode }) {
  const { preference } = useSidebarPreference();
  return (
    <div data-sidebar={preference ?? 'auto'} className="group/shell min-h-dvh">
      {children}
    </div>
  );
}
