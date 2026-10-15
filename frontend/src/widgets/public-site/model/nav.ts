/**
 * Public website navigation (docs/public-site.md §2). Labels live in `site.nav.*`.
 * Every href is a real route; the platform routes (/chat, /discover …) keep their own shell.
 */
export const PUBLIC_NAV = [
  { key: 'destinations', href: '/destinations' },
  { key: 'features', href: '/features' },
  { key: 'howItWorks', href: '/how-it-works' },
  { key: 'guides', href: '/guides' },
  { key: 'journal', href: '/blog' },
  { key: 'mobileApp', href: '/mobile-app' },
] as const;

export type PublicNavKey = (typeof PUBLIC_NAV)[number]['key'] | 'home';

export const FOOTER_COLUMNS = [
  {
    key: 'explore',
    links: [
      { key: 'home', href: '/' },
      { key: 'destinations', href: '/destinations' },
      { key: 'features', href: '/features' },
      { key: 'howItWorks', href: '/how-it-works' },
      { key: 'guides', href: '/guides' },
    ],
  },
  {
    key: 'read',
    links: [
      { key: 'journal', href: '/blog' },
      { key: 'mobileApp', href: '/mobile-app' },
    ],
  },
  {
    key: 'platform',
    links: [
      { key: 'openApp', href: '/chat' },
      { key: 'discover', href: '/discover' },
      { key: 'expo', href: '/expo' },
      { key: 'plans', href: '/plans' },
      { key: 'signIn', href: '/login' },
    ],
  },
  {
    key: 'legal',
    links: [
      { key: 'privacy', href: '/privacy' },
      { key: 'terms', href: '/terms' },
    ],
  },
] as const;

/** Active when the current path is the link or one of its children (`/blog/…` keeps Journal active). */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
