'use client';

import { Direction } from 'radix-ui';
import type { ReactNode } from 'react';

/** Tells Radix primitives (menus, tabs, selects) the reading direction of the current locale. */
export function DirectionProvider({ dir, children }: { dir: 'rtl' | 'ltr'; children: ReactNode }) {
  return <Direction.Provider dir={dir}>{children}</Direction.Provider>;
}
