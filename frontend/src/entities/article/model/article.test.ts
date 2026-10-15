import { describe, expect, it } from 'vitest';
import { SAMPLE_ARTICLES } from '../api/content/articles';
import { articleOutline, ArticleSchema, readingMinutes } from './article';

describe('journal articles (sample content)', () => {
  it('validate against the schema, with unique slugs', () => {
    for (const a of SAMPLE_ARTICLES) expect(() => ArticleSchema.parse(a), a.slug).not.toThrow();
    expect(new Set(SAMPLE_ARTICLES.map((a) => a.slug)).size).toBe(SAMPLE_ARTICLES.length);
  });

  it('never invent publication dates for sample content', () => {
    for (const a of SAMPLE_ARTICLES) {
      expect(a.status, a.slug).toBe('sample');
      expect(a.publishedAt, a.slug).toBeNull();
    }
  });

  it('have both languages for every text block', () => {
    for (const a of SAMPLE_ARTICLES) {
      for (const text of [a.title, a.excerpt, ...a.body.flatMap((b) => (b.type === 'list' ? b.items : 'text' in b ? [b.text] : []))]) {
        expect(text.ar.trim(), a.slug).not.toBe('');
        expect(text.en.trim(), a.slug).not.toBe('');
      }
    }
  });

  it('derive an outline and a reading time', () => {
    const a = SAMPLE_ARTICLES[0]!;
    expect(articleOutline(a).length).toBeGreaterThan(0);
    expect(readingMinutes(a, 'en')).toBeGreaterThanOrEqual(1);
  });
});
