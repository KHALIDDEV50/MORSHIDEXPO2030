'use client';

import { ArrowRight, Clock, FlaskConical } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Suspense, useMemo } from 'react';
import { ARTICLE_CATEGORIES, readingMinutes, type Article, type ArticleCategory } from '@/entities/article';
import { localize } from '@/shared/api';
import { SITE_MEDIA, type SiteMediaKey } from '@/shared/content';
import { Link, usePathname, useRouter } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { Reveal } from '@/shared/ui';
import { CtaBand, MediaImage, PageHero, Section } from '@/widgets/public-site';

export const mediaFor = (article: Article) => SITE_MEDIA[article.cover as SiteMediaKey] ?? SITE_MEDIA.masmak;

/**
 * Travel Journal (`/[locale]/blog`): a featured story, category filters (`?category=`, so a
 * filtered view can be shared), and the article list. Articles come from the CMS-ready article
 * repository and are clearly marked as sample content.
 */
export function JournalPageView({ articles }: { articles: Article[] }) {
  const t = useTranslations('site.journal');
  return (
    <>
      <PageHero eyebrow={t('hero.eyebrow')} titleLines={[t('hero.line1'), t('hero.line2')]} accentLine={1} intro={t('hero.intro')} media={SITE_MEDIA.historicJeddah}>
        <p className="motion-rise bg-warning-tint text-warning-fg border-warning/30 inline-flex w-fit items-start gap-2 rounded-xl border px-3 py-2 text-sm">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('sampleNotice')}
        </p>
      </PageHero>
      <Suspense fallback={<Listing articles={articles} category={null} />}>
        <FilteredListing articles={articles} />
      </Suspense>
      <CtaBand title={t('final.title')} body={t('final.body')} primary={{ href: '/chat', label: t('final.primary') }} secondary={{ href: '/destinations', label: t('final.secondary') }} media={SITE_MEDIA.turaif} />
    </>
  );
}

function FilteredListing({ articles }: { articles: Article[] }) {
  const raw = useSearchParams().get('category');
  const category = (ARTICLE_CATEGORIES as readonly string[]).includes(raw ?? '') ? (raw as ArticleCategory) : null;
  return <Listing articles={articles} category={category} />;
}

function Listing({ articles, category }: { articles: Article[]; category: ArticleCategory | null }) {
  const t = useTranslations('site.journal');
  const router = useRouter();
  const pathname = usePathname();
  const featured = articles.find((a) => a.featured);
  const list = useMemo(() => (category ? articles.filter((a) => a.category === category) : articles.filter((a) => a !== featured)), [articles, category, featured]);
  const used = new Set(articles.map((a) => a.category));

  const choose = (c: ArticleCategory | null) => router.replace(c ? `${pathname}?category=${c}` : pathname, { scroll: false });

  return (
    <>
      {!category && featured && (
        <Section labelledBy="featured-title" className="pb-8 sm:pb-10">
          <h2 id="featured-title" className="sr-only">
            {t('featured')}
          </h2>
          <FeaturedStory article={featured} />
        </Section>
      )}
      <Section labelledBy="all-title" className={cn('border-border border-t', !category && featured && 'pt-12 sm:pt-16')}>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <h2 id="all-title" className="type-h1">
            {category ? t(`categories.${category}`) : t('latest')}
          </h2>
          <div role="group" aria-label={t('filterLabel')} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {[null, ...ARTICLE_CATEGORIES.filter((c) => used.has(c))].map((c) => (
              <button
                key={c ?? 'all'}
                type="button"
                aria-pressed={category === c}
                onClick={() => choose(c)}
                className={cn('focus-ring h-9 shrink-0 rounded-full px-4 text-sm font-bold transition-colors', category === c ? 'bg-fg text-background' : 'border-border bg-surface text-fg-secondary hover:text-fg border')}
              >
                {c ? t(`categories.${c}`) : t('all')}
              </button>
            ))}
          </div>
        </div>
        {list.length === 0 ? (
          <p className="border-border text-fg-secondary rounded-2xl border border-dashed p-8 text-center">{t('empty')}</p>
        ) : (
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a, i) => (
              <Reveal as="li" key={a.slug} delay={(i % 3) * 90} className={cn(i === 0 && list.length > 2 && 'lg:col-span-2')}>
                <ArticleCard article={a} wide={i === 0 && list.length > 2} />
              </Reveal>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function FeaturedStory({ article }: { article: Article }) {
  const t = useTranslations('site.journal');
  const locale = useLocale();
  return (
    <Link href={`/blog/${article.slug}`} className="group focus-ring grid items-center gap-8 rounded-[2rem] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <MediaImage media={mediaFor(article)} reveal="clip" sizes="(min-width: 1024px) 60vw, 100vw" credit="none" className="aspect-[16/10] rounded-[2rem]" imageClassName="transition-transform duration-[1200ms] group-hover:scale-105 motion-reduce:group-hover:scale-100" />
      <Reveal className="flex flex-col gap-4">
        <span className="eyebrow text-accent-pink">
          {t('featured')} · {t(`categories.${article.category}`)}
        </span>
        <span className="type-statement group-hover:text-primary [text-wrap:balance] transition-colors">{localize(article.title, locale)}</span>
        <span className="type-body-lg text-fg-secondary">{localize(article.excerpt, locale)}</span>
        <Meta article={article} />
        <span className="text-primary inline-flex items-center gap-1.5 text-sm font-bold">
          {t('read')}
          <ArrowRight className="nudge flip-rtl size-4" aria-hidden />
        </span>
      </Reveal>
    </Link>
  );
}

export function ArticleCard({ article, wide = false }: { article: Article; wide?: boolean }) {
  const t = useTranslations('site.journal');
  const locale = useLocale();
  return (
    <Link href={`/blog/${article.slug}`} className="group focus-ring flex h-full flex-col gap-4 rounded-[1.5rem]">
      <MediaImage
        media={mediaFor(article)}
        sizes={wide ? '(min-width: 1024px) 66vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
        credit="none"
        className={cn('rounded-[1.5rem]', wide ? 'aspect-[16/9]' : 'aspect-[4/3]')}
        imageClassName="transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
      />
      <span className="flex flex-col gap-2">
        <span className="eyebrow text-accent-pink">{t(`categories.${article.category}`)}</span>
        <span className={cn('font-display group-hover:text-primary leading-snug font-bold transition-colors', wide ? 'text-2xl sm:text-3xl' : 'text-xl')}>{localize(article.title, locale)}</span>
        <span className="text-fg-secondary line-clamp-2 text-[0.9375rem]">{localize(article.excerpt, locale)}</span>
        <Meta article={article} />
      </span>
    </Link>
  );
}

export function Meta({ article, className }: { article: Article; className?: string }) {
  const t = useTranslations('site.journal');
  const locale = useLocale();
  return (
    <span className={cn('text-fg-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs', className)}>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5" aria-hidden />
        {t('minutes', { count: readingMinutes(article, locale) })}
      </span>
      <span>{t('byline')}</span>
      {article.status === 'sample' && <span className="bg-warning-tint text-warning-fg rounded-full px-2 py-0.5 font-bold">{t('sampleBadge')}</span>}
    </span>
  );
}
