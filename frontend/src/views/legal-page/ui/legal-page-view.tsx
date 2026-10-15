'use client';

import { FileWarning, Scale, Wrench } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { localize } from '@/shared/api';
import { Link } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { PageHero } from '@/widgets/public-site';
import { PRIVACY, TERMS, type LegalSection } from '../model/legal-content';

const DOCS = { privacy: PRIVACY, terms: TERMS } as const;

/**
 * Legal document layout (privacy, terms): draft banner, table of contents, numbered sections,
 * and a visible flag on every section that still needs legal or technical confirmation.
 */
export function LegalPageView({ doc }: { doc: keyof typeof DOCS }) {
  const t = useTranslations('site.legal');
  const locale = useLocale();
  const { sections } = DOCS[doc];
  const pending = sections.filter((s) => s.review).length;

  return (
    <>
      <PageHero size="sm" eyebrow={t(`${doc}.eyebrow`)} title={t(`${doc}.title`)} intro={t(`${doc}.intro`)}>
        <div role="note" className="motion-rise border-warning/40 bg-warning-tint text-warning-fg flex max-w-3xl items-start gap-3 rounded-2xl border p-4 text-sm">
          <FileWarning className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span className="flex flex-col gap-1">
            <strong>{t('draftTitle')}</strong>
            <span>{t('draftBody', { count: pending })}</span>
          </span>
        </div>
        <p className="motion-rise type-caption text-fg-muted">{t('checked')}</p>
      </PageHero>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-20">
        <nav aria-label={t('toc')} className="lg:sticky lg:top-28 lg:self-start">
          <details open className="border-border bg-surface rounded-2xl border p-4 lg:border-0 lg:bg-transparent lg:p-0">
            <summary className="eyebrow text-fg-muted cursor-pointer list-none lg:pointer-events-none [&::-webkit-details-marker]:hidden">{t('toc')}</summary>
            <ol className="mt-3 flex flex-col gap-1.5 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="focus-ring text-fg-secondary hover:text-fg flex gap-2 rounded-sm">
                    <span className="text-fg-muted w-5 shrink-0 tabular-nums">{i + 1}.</span>
                    <span>{localize(s.title, locale)}</span>
                  </a>
                </li>
              ))}
            </ol>
          </details>
        </nav>

        <div className="flex min-w-0 flex-col gap-2">
          {sections.map((s, i) => (
            <Section key={s.id} section={s} n={i + 1} />
          ))}
          <p className="border-border text-fg-muted mt-8 border-t pt-6 text-sm">
            {t('related')}{' '}
            <Link href={doc === 'privacy' ? '/terms' : '/privacy'} className="text-primary font-bold underline-offset-2 hover:underline">
              {t(doc === 'privacy' ? 'terms.title' : 'privacy.title')}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

function Section({ section, n }: { section: LegalSection; n: number }) {
  const t = useTranslations('site.legal');
  const locale = useLocale();
  return (
    <section id={section.id} aria-labelledby={`${section.id}-h`} className={cn('scroll-mt-28 rounded-2xl py-6', section.review && 'border-warning/30 bg-warning-tint/40 border border-dashed px-5')}>
      <h2 id={`${section.id}-h`} className="type-h2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <span className="text-fg-muted tabular-nums">{n}.</span>
        <span>{localize(section.title, locale)}</span>
        {section.review && (
          <span className="border-warning/40 text-warning-fg inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-sans text-xs font-bold">
            {section.review === 'legal' ? <Scale className="size-3.5" aria-hidden /> : <Wrench className="size-3.5" aria-hidden />}
            {t(section.review === 'legal' ? 'needsLegal' : 'needsTechnical')}
          </span>
        )}
      </h2>
      <div className="prose-morshid mt-3">
        {section.blocks.map((b, i) =>
          'p' in b ? (
            <p key={i}>{localize(b.p, locale)}</p>
          ) : (
            <ul key={i}>
              {b.list.map((item, j) => (
                <li key={j}>{localize(item, locale)}</li>
              ))}
            </ul>
          ),
        )}
      </div>
    </section>
  );
}
