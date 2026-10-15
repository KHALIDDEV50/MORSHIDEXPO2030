import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { articleRepository } from '@/entities/article';
import { localize } from '@/shared/api';
import { routing } from '@/shared/i18n';
import { ArticlePageView } from '@/views/journal-page';
import { resolveLocale } from '../../route-helpers';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const articles = await articleRepository.list();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const article = await articleRepository.get(slug);
  if (!article) return {};
  return {
    title: localize(article.title, locale),
    description: localize(article.excerpt, locale),
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/blog/${slug}`])) },
    openGraph: { title: localize(article.title, locale), description: localize(article.excerpt, locale), type: 'article', locale },
  };
}

export default async function ArticlePage({ params }: Props) {
  await resolveLocale(params);
  const { slug } = await params;
  const article = await articleRepository.get(slug);
  if (!article) notFound();
  const all = await articleRepository.list();
  const related = all.filter((a) => a.slug !== article.slug).sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category)).slice(0, 3);
  return <ArticlePageView article={article} related={related} />;
}
