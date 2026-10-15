import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@/shared/config';
import ar from './ar.json';
import en from './en.json';

type Tree = { [key: string]: string | Tree };

function flattenKeys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : flattenKeys(value, `${prefix}${key}.`),
  );
}

const dictionaries: Record<string, Tree> = { ar, en };

describe('translation dictionaries', () => {
  it('has a dictionary for every supported locale', () => {
    expect(Object.keys(dictionaries).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it('keeps the same keys in every locale', () => {
    const reference = flattenKeys(en).sort();
    for (const locale of SUPPORTED_LOCALES) {
      expect(flattenKeys(dictionaries[locale] as Tree).sort(), locale).toEqual(reference);
    }
  });

  it('has no empty strings', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const tree = dictionaries[locale] as Tree;
      const values = flattenKeys(tree).map((path) =>
        path.split('.').reduce<string | Tree>((node, key) => (node as Tree)[key] as string | Tree, tree),
      );
      expect(values.every((v) => typeof v === 'string' && v.trim().length > 0), locale).toBe(true);
    }
  });
});
