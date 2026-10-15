'use client';

import { ArrowLeft, BookOpen, ExternalLink, FlaskConical, Lightbulb, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { articleOutline, type Article, type ArticleBlock } from '@/entities/article';
import { usePlaceSearch, type Place } from '@/entities/place';
import { localize } from '@/shared/api';
import { Link } from '@/shared/i18n';
import { Reveal } from '@/shared/ui';
import { CtaBand, Eyebrow, MediaCredit, MediaImage } from '@/widgets/public-site';
import { ArticleCard, mediaFor, Meta } from './journal-page-view';

/**
 * Journal article (`/[locale]/blog/[slug]`): cinematic cover, an outline that follows the
 * reading, structured blocks, links into Discover for every place mentioned, the public sources
 * behind the facts, and related stories. Sample status and the photo credit are always visible.
 */
export function ArticlePageView({ article, related }: { article: Article; related: Article[] }) {
  const t = useTranslations('site.journal');
  const locale = useLocale();
  const media = mediaFor(article);
  const outline = articleOutline(article);
  const places = usePlaceSearch({ locale, pageSize: 100 });
  const byId = new Map((places.data?.items ?? []).map((p) => [p.id, p]));
  const mentioned = article.relatedPlaceIds.map((id) => byId.get(id)).filter((p): p is Place => Boolean(p));

  return (
    <article>
      {/* Cover: title on ivory, then the photo in a Najdi frame (no dark overlay) */}
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-28 sm:px-6 sm:pt-32">
        <div className="flex max-w-4xl flex-col gap-5">
          <Link href="/blog" className="motion-rise focus-ring text-fg-secondary hover:text-fg inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-bold">
            <ArrowLeft className="flip-rtl size-4" aria-hidden />
            {t('back')}
          </Link>
          <Eyebrow className="motion-rise">{t(`categories.${article.category}`)}</Eyebrow>
          <h1 className="motion-rise type-hero !text-[clamp(2.25rem,5vw,4.25rem)] [text-wrap:balance]">{localize(article.title, locale)}</h1>
          <p className="motion-rise type-body-lg text-fg-secondary max-w-[40rem]">{localize(article.excerpt, locale)}</p>
          <Meta article={article} className="motion-rise" />
        </div>
        <MediaImage media={media} priority frame="najdi" reveal="scale" sizes="(min-width: 1280px) 80rem, 100vw" className="aspect-[16/9] w-full rounded-b-[2rem] sm:aspect-[21/9]" imageClassName="motion-settle" />
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)_16rem] lg:py-20">
        {/* Outline */}
        <nav aria-label={t('outline')} className="hidden lg:block">
          <div className="sticky top-28 flex flex-col gap-3">
            <span className="eyebrow text-fg-muted">{t('outline')}</span>
            <ol className="border-border flex flex-col gap-2 border-s ps-4 text-sm">
              {outline.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="focus-ring text-fg-secondary hover:text-fg rounded-sm">
                    {localize(h.text, locale)}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Body */}
        <div className="flex min-w-0 flex-col gap-10">
          <p role="note" className="border-warning/30 bg-warning-tint text-warning-fg flex items-start gap-2 rounded-xl border px-4 py-3 text-sm">
            <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('articleSampleNote')}
          </p>
          <div className="prose-morshid">
            {article.body.map((block, i) => (
              <Block key={i} block={block} places={byId} />
            ))}
          </div>

          {article.sources.length > 0 && (
            <section aria-labelledby="sources-title" className="border-border flex flex-col gap-3 border-t pt-8">
              <h2 id="sources-title" className="type-h3 inline-flex items-center gap-2">
                <BookOpen className="text-accent-pink size-5" aria-hidden />
                {t('sources')}
              </h2>
              <ul className="flex flex-col gap-2">
                {article.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" dir="ltr" className="focus-ring text-primary inline-flex items-start gap-1.5 rounded-sm text-sm underline-offset-2 hover:underline">
                      <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="type-caption text-fg-muted">
            {t('photoLine')} <MediaCredit media={media} variant="text" />
          </p>
        </div>

        {/* Places in this article */}
        <aside aria-labelledby="places-title" className="flex flex-col gap-3 lg:sticky lg:top-28 lg:self-start">
          <h2 id="places-title" className="eyebrow text-fg-muted">
            {t('placesTitle')}
          </h2>
          <ul className="flex flex-col gap-2">
            {mentioned.map((p) => (
              <li key={p.id}>
                <Link href={`/discover/${p.id}`} className="group focus-ring border-border bg-surface hover:border-primary/40 flex items-center gap-3 rounded-xl border p-3 transition-colors">
                  <MapPin className="text-primary size-4 shrink-0" aria-hidden />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold group-hover:underline">{localize(p.name, locale)}</span>
                    <span className="text-fg-muted text-xs">{localize(p.region.city, locale)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/discover" className="focus-ring text-primary w-fit rounded-sm text-sm font-bold hover:underline">
            {t('allPlaces')}
          </Link>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-border border-t">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20">
            <h2 id="related-title" className="type-h1">
              {t('related')}
            </h2>
            <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a, i) => (
                <Reveal as="li" key={a.slug} delay={i * 90}>
                  <ArticleCard article={a} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
      <CtaBand title={t('articleCta.title')} body={t('articleCta.body')} primary={{ href: '/chat', label: t('articleCta.primary') }} secondary={{ href: '/blog', label: t('articleCta.secondary') }} />
    </article>
  );
}

function Block({ block, places }: { block: ArticleBlock; places: Map<string, Place> }) {
  const locale = useLocale();
  const t = useTranslations('site.journal');
  switch (block.type) {
    case 'p':
      return <p>{localize(block.text, locale)}</p>;
    case 'h2':
      return <h2 id={block.id}>{localize(block.text, locale)}</h2>;
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag>
          {block.items.map((item, i) => (
            <li key={i}>{localize(item, locale)}</li>
          ))}
        </Tag>
      );
    }
    case 'tip':
      return (
        <aside className="border-sand-deep bg-sand text-fg flex items-start gap-3 rounded-2xl border p-4 text-[0.9375rem] leading-relaxed">
          <Lightbulb className="text-accent-pink mt-1 size-4 shrink-0" aria-hidden />
          <span>
            <strong className="text-accent-pink">{t('tip')} </strong>
            {localize(block.text, locale)}
          </span>
        </aside>
      );
    case 'places': {
      const found = block.placeIds.map((id) => places.get(id)).filter((p): p is Place => Boolean(p));
      if (found.length === 0) return null;
      return (
        <ul className="!m-0 !mt-5 flex !list-none flex-wrap gap-2 !p-0">
          {found.map((p) => (
            <li key={p.id} className="!m-0">
              <Link href={`/discover/${p.id}`} className="focus-ring border-border bg-surface hover:border-primary/50 text-fg inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold !no-underline transition-colors">
                <MapPin className="text-primary size-3.5" aria-hidden />
                {localize(p.name, locale)}
              </Link>
            </li>
          ))}
        </ul>
      );
    }
  }
}
