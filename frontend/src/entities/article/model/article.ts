import { z } from 'zod';
import { LocalizedTextSchema, localize, type LocalizedText } from '@/shared/api';

/**
 * Travel Journal article (CMS-ready, docs/public-site.md §5). Content is structured blocks in
 * both languages so it can move to a headless CMS unchanged.
 *
 * Honesty rules: `status: 'sample'` marks content written for the demo; `publishedAt` and the
 * author stay null/editorial — no invented dates, bylines, interviews or quotes. Factual claims
 * list their public `sources`.
 */
export const ARTICLE_CATEGORIES = ['riyadh', 'heritage', 'saudi', 'expo', 'tips', 'morshid'] as const;
export const ArticleCategorySchema = z.enum(ARTICLE_CATEGORIES);
export type ArticleCategory = z.infer<typeof ArticleCategorySchema>;

export const ArticleBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('p'), text: LocalizedTextSchema }),
  z.object({ type: z.literal('h2'), id: z.string(), text: LocalizedTextSchema }),
  z.object({ type: z.literal('list'), ordered: z.boolean().optional(), items: z.array(LocalizedTextSchema).min(1) }),
  z.object({ type: z.literal('tip'), text: LocalizedTextSchema }),
  /** Inline links into Discover for the places discussed */
  z.object({ type: z.literal('places'), placeIds: z.array(z.string()).min(1) }),
]);
export type ArticleBlock = z.infer<typeof ArticleBlockSchema>;

export const ArticleSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: ArticleCategorySchema,
  title: LocalizedTextSchema,
  excerpt: LocalizedTextSchema,
  /** Key into the site media library (shared/content SITE_MEDIA) */
  cover: z.string(),
  body: z.array(ArticleBlockSchema).min(1),
  relatedPlaceIds: z.array(z.string()),
  sources: z.array(z.object({ label: z.string(), url: z.string().url() })),
  /** 'sample' = demo content; a CMS would add 'draft' / 'published' */
  status: z.enum(['sample', 'draft', 'published']),
  /** null until a real editorial publication date exists (never invented) */
  publishedAt: z.string().nullable(),
  featured: z.boolean(),
});
export type Article = z.infer<typeof ArticleSchema>;

/** Rough reading time (≈200 words per minute), at least one minute. */
export function readingMinutes(article: Article, locale: string): number {
  const words = article.body
    .flatMap((b) => (b.type === 'p' || b.type === 'tip' || b.type === 'h2' ? [b.text] : b.type === 'list' ? b.items : []))
    .map((text: LocalizedText) => localize(text, locale).split(/\s+/).filter(Boolean).length)
    .reduce((sum, n) => sum + n, 0);
  return Math.max(1, Math.round(words / 200));
}

/** Section headings, for the article's table of contents. */
export function articleOutline(article: Article): { id: string; text: LocalizedText }[] {
  return article.body.flatMap((b) => (b.type === 'h2' ? [{ id: b.id, text: b.text }] : []));
}
