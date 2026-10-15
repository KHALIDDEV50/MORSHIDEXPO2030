import { ArticleSchema, type Article } from '../model/article';
import type { ArticleRepository } from './article.repository';
import { SAMPLE_ARTICLES } from './content/articles';

/** Validated once, like any API response would be. */
const ARTICLES: Article[] = SAMPLE_ARTICLES.map((a) => ArticleSchema.parse(a));

/** Bundled sample content (works on the server, so article pages are statically generated). */
export const localArticleRepository: ArticleRepository = {
  async list(query) {
    const items = query?.category ? ARTICLES.filter((a) => a.category === query.category) : ARTICLES;
    return [...items].sort((a, b) => Number(b.featured) - Number(a.featured));
  },
  async get(slug) {
    return ARTICLES.find((a) => a.slug === slug) ?? null;
  },
};
