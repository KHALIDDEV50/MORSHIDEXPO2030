import type { Article, ArticleCategory } from '../model/article';

/**
 * Travel Journal source (docs/public-site.md §5). Today: the bundled sample articles. A headless
 * CMS can implement the same two calls later without touching the pages.
 */
export type ArticleRepository = {
  list(query?: { category?: ArticleCategory }): Promise<Article[]>;
  get(slug: string): Promise<Article | null>;
};
