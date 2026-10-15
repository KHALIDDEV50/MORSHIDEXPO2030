'use client';

import { ArrowLeft, CalendarClock, Clock, Hash, Info, Map as MapIcon, MapPin, Shapes } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, type ReactNode } from 'react';
import { CharacterAvatar, useActiveCharacter } from '@/entities/ai-character';
import { BoothPhoto, BoothPhotoCredit, EXPO_SITE, useBooth, useExpoLayout, type ExpoBooth } from '@/entities/expo';
import { AddToPlanButton } from '@/features/add-to-plan';
import { AskAboutBoothButton } from '@/features/ask-about-place';
import { isApiError, localize } from '@/shared/api';
import { Link } from '@/shared/i18n';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { MapView, zoneColor, type LocalLayer } from '@/shared/map';
import { Button, DemoBadge, EmptyState, ErrorState, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';
import { ChatDock, ChatLauncher, useDockTarget } from '@/widgets/chat-thread';

/** Booth (pavilion) details — Screen 8 (PRD §4.3). Fictional demo pavilion, always labelled. */
export function BoothDetailsView({ boothId }: { boothId: string }) {
  const t = useTranslations('boothDetails');
  const query = useBooth(boothId);
  if (query.isPending) {
    return (
      <div className="bg-page flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6" aria-busy="true">
          <Skeleton className="aspect-[21/9] w-full rounded-2xl" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="bg-page flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          {isApiError(query.error) && query.error.code === 'NOT_FOUND' ? (
            <EmptyState
              icon={<Shapes />}
              title={t('notFoundTitle')}
              description={t('notFoundDescription')}
              action={
                <Button asChild variant="secondary">
                  <Link href="/expo">{t('backToExpo')}</Link>
                </Button>
              }
            />
          ) : (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          )}
        </div>
      </div>
    );
  }
  return <BoothDetails booth={query.data} />;
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-fg-muted [&_svg]:size-4" aria-hidden>
        {icon}
      </span>
      <dt className="text-fg-secondary flex-1 text-sm">{label}</dt>
      <dd className="text-sm font-bold">{value}</dd>
    </div>
  );
}

function BoothDetails({ booth }: { booth: ExpoBooth }) {
  const t = useTranslations('boothDetails');
  const te = useTranslations('expoMap');
  const tc = useTranslations('characters');
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const layout = useExpoLayout();
  const [character] = useActiveCharacter();
  const [chatOpen, setChatOpen] = useState(false);
  const zone = layout.data?.zones.find((z) => z.id === booth.zoneId);
  const name = localize(booth.name, locale);
  const zoneLabel = zone ? te('zoneShort', { number: zone.number, name: localize(zone.name, locale) }) : null;
  const dock = useDockTarget({ kind: 'booth', id: booth.id, name: `${booth.number} · ${name}` });

  const localLayer = useMemo<LocalLayer | undefined>(
    () =>
      layout.data && {
        extent: EXPO_SITE,
        site: layout.data.site,
        paths: layout.data.paths,
        zones: layout.data.zones.map((z) => ({ id: z.id, number: z.number, name: localize(z.name, locale), color: z.color, polygon: z.polygon, labelAt: z.labelAt })),
      },
    [layout.data, locale],
  );

  const actions = (
    <>
      <AddToPlanButton booth={booth} className="sm:flex-1 lg:flex-none" />
      <Button asChild variant="secondary" className="sm:flex-1 lg:flex-none">
        <Link href={`/expo?focus=${encodeURIComponent(booth.id)}`}>
          <MapIcon aria-hidden />
          {t('showOnMap')}
        </Link>
      </Button>
      <AskAboutBoothButton booth={booth} onAsk={() => setChatOpen(true)} className="sm:flex-1 lg:flex-none" />
    </>
  );

  return (
    <div className="bg-page flex-1">
      <article className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-6 pb-28 sm:px-6 lg:pt-8">
        <Link href="/expo" className="focus-ring text-fg-secondary hover:text-fg inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium">
          <ArrowLeft className="flip-rtl size-4" aria-hidden />
          {t('backToExpo')}
        </Link>

        {/* Hero: the pavilion's theme photo (illustrative) with its number in the zone color */}
        <div className="flex flex-col gap-1.5">
          <div className="relative overflow-hidden rounded-2xl">
            <BoothPhoto booth={booth} priority sizes="(min-width: 1152px) 1152px, 100vw" className="aspect-[16/9] w-full sm:aspect-[21/9]" />
            <span
              dir="ltr"
              style={{ borderColor: zone ? zoneColor(zone.color) : undefined }}
              className="bg-surface-elevated absolute start-4 bottom-4 grid h-12 min-w-12 place-items-center rounded-full border-[3px] px-2 text-base font-bold tabular-nums shadow-lg"
              aria-hidden
            >
              {booth.number}
            </span>
          </div>
          <BoothPhotoCredit booth={booth} className="px-1" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
          <div className="flex min-w-0 flex-col gap-6">
            <header className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <DemoBadge label={te('demoData')} />
                {zoneLabel && (
                  <span className="type-caption text-fg-secondary inline-flex items-center gap-1.5">
                    {zone && <span className="size-2.5 rounded-full" style={{ background: zoneColor(zone.color) }} aria-hidden />}
                    {zoneLabel}
                  </span>
                )}
              </div>
              <h1 className="type-h1">
                <span dir="ltr" className="text-fg-muted me-2 tabular-nums">
                  {booth.number}
                </span>
                {name}
              </h1>
              <p className="type-body-lg text-fg-secondary">{localize(booth.summary, locale)}</p>
              <div className="flex flex-col gap-2 sm:flex-row lg:hidden">{actions}</div>
            </header>

            <Tabs defaultValue="activities" className="flex flex-col gap-4">
              <TabsList aria-label={t('tabsLabel')} className="w-fit max-w-full overflow-x-auto">
                <TabsTrigger value="activities">{t('tabs.activities')}</TabsTrigger>
                <TabsTrigger value="description">{t('tabs.description')}</TabsTrigger>
                <TabsTrigger value="location">{t('tabs.location')}</TabsTrigger>
              </TabsList>
              <TabsContent value="activities">
                <ul className="flex flex-col gap-3">
                  {booth.activities.map((a, i) => (
                    <li key={i} className="border-border bg-surface flex items-center gap-4 rounded-xl border p-4 shadow-xs">
                      <span className="bg-primary-tint text-primary flex size-14 shrink-0 flex-col items-center justify-center rounded-xl">
                        <CalendarClock className="size-4" aria-hidden />
                        {a.time && (
                          <span dir="ltr" className="text-sm font-bold tabular-nums">
                            {a.time}
                          </span>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-[0.9375rem] font-bold">{localize(a.title, locale)}</span>
                        {a.time && <span className="type-caption text-fg-muted">{t('demoTime')}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="description">
                <p className="type-body text-fg-secondary" dir="auto">
                  {localize(booth.description, locale)}
                </p>
              </TabsContent>
              <TabsContent value="location" className="flex flex-col gap-3">
                {localLayer ? (
                  <MapView
                    mode="local"
                    label={t('mapLabel', { name })}
                    localLayer={localLayer}
                    markers={[{ id: booth.id, position: booth.position, code: booth.number, color: zone ? zoneColor(zone.color) : undefined, label: `${booth.number} · ${name}`, kind: 'place' }]}
                    selectedId={booth.id}
                    fitToMarkers={false}
                    className="border-border h-72 rounded-xl border"
                  />
                ) : (
                  <Skeleton className="h-72 rounded-xl" />
                )}
                <p className="type-caption text-fg-muted">{t('locationNote')}</p>
              </TabsContent>
            </Tabs>

            {/* Chat entry at the end of the page: opens the popup with this pavilion as context */}
            <section className="border-primary/20 bg-surface-brand flex flex-col items-start gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center">
              <CharacterAvatar id={character} size="lg" decorative className="shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="type-h4">{t('askTitle', { name: tc(`${character}.name`) })}</h2>
                <p className="type-body-sm text-fg-secondary font-normal">{t('askBody', { name })}</p>
              </div>
              <AskAboutBoothButton booth={booth} variant="primary" onAsk={() => setChatOpen(true)} />
            </section>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            <div className="hidden flex-col gap-2 lg:flex">{actions}</div>
            <dl className="border-border bg-surface flex flex-col divide-y divide-[var(--border)] rounded-xl border">
              <Fact icon={<Clock />} label={t('duration')} value={formatDuration(booth.suggestedDurationMin)} />
              <Fact icon={<Hash />} label={t('number')} value={<span dir="ltr">{booth.number}</span>} />
              <Fact icon={<Shapes />} label={t('category')} value={te(`category.${booth.category}`)} />
              {zoneLabel && <Fact icon={<MapPin />} label={t('zone')} value={zoneLabel} />}
            </dl>
            <p role="note" className="border-border bg-surface-muted text-fg-secondary flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('demoNote')}
            </p>
          </aside>
        </div>
      </article>

      <ChatDock open={chatOpen} onClose={() => setChatOpen(false)} {...dock} />
      <ChatLauncher label={dock.label} onOpen={() => setChatOpen(true)} hidden={chatOpen} />
    </div>
  );
}
