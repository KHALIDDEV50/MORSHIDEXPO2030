import { Cairo, Tajawal } from 'next/font/google';

/**
 * D-006: Cairo is the display font (temporary stand-in for Expo Arabic),
 * Tajawal is the body/UI font. Both are self-hosted by next/font at build time.
 * Components never reference these variables directly — only `--font-display` / `--font-body`
 * (see globals.css), so swapping the display font is a one-line change.
 */
export const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  variable: '--font-cairo',
});

export const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-tajawal',
});
