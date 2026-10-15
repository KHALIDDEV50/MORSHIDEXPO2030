/**
 * Locale registry. Adding a language = add an entry here + a `messages/<code>.json` file.
 * v1 ships Arabic (default, RTL) and English (LTR) — see docs/architecture.md §6.
 */
export const LOCALES = {
  ar: { code: 'ar', dir: 'rtl', label: 'العربية' },
  en: { code: 'en', dir: 'ltr', label: 'English' },
} as const;

export type Locale = keyof typeof LOCALES;
export type Direction = (typeof LOCALES)[Locale]['dir'];

export const SUPPORTED_LOCALES = Object.keys(LOCALES) as Locale[];
export const DEFAULT_LOCALE: Locale = 'ar';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && value in LOCALES;
}

export function getDirection(locale: Locale): Direction {
  return LOCALES[locale].dir;
}
