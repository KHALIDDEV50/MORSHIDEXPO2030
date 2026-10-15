import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, getDirection, isLocale } from './locales';

describe('locale registry', () => {
  it('ships Arabic (default) and English', () => {
    expect(SUPPORTED_LOCALES).toEqual(['ar', 'en']);
    expect(DEFAULT_LOCALE).toBe('ar');
  });

  it('maps Arabic to RTL and English to LTR', () => {
    expect(getDirection('ar')).toBe('rtl');
    expect(getDirection('en')).toBe('ltr');
  });

  it('recognises only supported locale codes', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
