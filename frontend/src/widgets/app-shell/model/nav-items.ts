/**
 * The five top-level destinations (D-010), in order. Single source for the rail (≥768px)
 * and the bottom navigation (<768px). Profile is pinned to the end of the rail (D-013).
 */
export const NAV_ITEMS = [
  { key: 'chat', href: '/chat' },
  { key: 'discover', href: '/discover' },
  { key: 'expo', href: '/expo' },
  { key: 'plans', href: '/plans' },
  { key: 'profile', href: '/settings' },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
export type NavKey = NavItem['key'];

/**
 * Desktop sidebar order (P-025, Expo-first Phase 3): Chat · Expo · Discover, then Plans; Profile
 * stays pinned at the bottom. The phone bottom navigation keeps NAV_ITEMS' order (the approved
 * mobile layout is unchanged). Same items and routes — only the order differs.
 */
const SIDEBAR_ORDER: NavKey[] = ['chat', 'expo', 'discover', 'plans', 'profile'];
export const SIDEBAR_ITEMS: readonly NavItem[] = SIDEBAR_ORDER.map((key) => NAV_ITEMS.find((item) => item.key === key)!);

/** The destination given extra emphasis in the sidebar (Expo-first, P-025). */
export const FEATURED_NAV_KEY: NavKey = 'expo';

/** Active when the current (locale-less) path is the item or one of its children. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function activeItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isActive(pathname, item.href));
}

/** Guided Start Plan mode hides the bottom navigation on phones (D-015, D-017). */
export function isGuidedMode(pathname: string): boolean {
  return /^\/plans\/[^/]+\/guide\/?$/.test(pathname);
}
