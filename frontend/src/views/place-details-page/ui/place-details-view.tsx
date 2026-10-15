'use client';

import { ArrowLeft, Baby, Building2, CalendarClock, Clock, Landmark, Lightbulb, MapPin, Sun, Ticket, Trees } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, type ReactNode } from 'react';
import { AddToPlanButton } from '@/features/add-to-plan';
import { AskAboutPlaceButton } from '@/features/ask-about-place';
import { CharacterAvatar, useActiveCharacter } from '@/entities/ai-character';
import { CATEGORY_ICON, CATEGORY_TONE, DestinationCard, PhotoCredit, placeArea, PlacePhoto, placePhoto, usePlace, usePlaceCardData, usePlaceSearch, type Place } from '@/entities/place';
import { isApiError, localize } from '@/shared/api';
import { Link, useRouter } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import { MapView } from '@/shared/map';
import { Badge, Button, DemoBadge, EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import { ChatDock, ChatLauncher, useDockTarget } from '@/widgets/chat-thread';

/** Place details (PRD §4.2, Screen 10 corrected): no ratings, reviews or distance-from-user. */
export function PlaceDetailsView({ placeId }: { placeId: string }) {
  const t = useTranslations('placeDetails');
  const query = usePlace(placeId);

  if (query.isPending) return <DetailsSkeleton />;
  if (query.isError) {
    const notFound = isApiError(query.error) && query.error.code === 'NOT_FOUND';
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        {notFound ? (
          <EmptyState
            icon={<MapPin />}
            title={t('notFoundTitle')}
            description={t('notFoundDescription')}
            action={
              <Button asChild variant="secondary">
                <Link href="/discover">{t('backToDiscover')}</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </div>
    );
  }
  return <PlaceDetails place={query.data} />;
}

function PlaceDetails({ place }: { place: Place }) {
  const [chatOpen, setChatOpen] = useState(false);
  const t = useTranslations('placeDetails');
  const tc = useTranslations('discover.categories');
  const tch = useTranslations('characters');
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const [character] = useActiveCharacter();
  const name = localize(place.name, locale);
  const primary = place.categories[0]!;
  // The character's "did you know" line: authored narration, else the history note, else the summary
  const narration = localize(place.narration ?? place.history ?? place.summary, locale);
  const photo = placePhoto(place, locale);

  type Fact = { icon: ReactNode; label: string; value: string };
  const facts = (
    [
    { icon: <Clock />, label: t('suggestedDuration'), value: formatDuration(place.suggestedDurationMin) },
    place.bestTime && { icon: <Sun />, label: t('bestTime'), value: localize(place.bestTime, locale) },
    { icon: place.attributes.indoor ? <Building2 /> : <Trees />, label: t('setting'), value: place.attributes.indoor ? t('indoor') : t('outdoor') },
    place.attributes.familyFriendly && { icon: <Baby />, label: t('family'), value: t('familyYes') },
    place.attributes.freeEntry && { icon: <Ticket />, label: t('entry'), value: t('freeEntry') },
    ] as (Fact | false | undefined)[]
  ).filter((f): f is Fact => Boolean(f));

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-6 pb-24 sm:px-6 lg:pt-8">
      <BackLink />

      {/* Hero with the active character's narration bubble */}
      <div className="flex flex-col gap-1.5">
        <div className="relative overflow-hidden rounded-2xl">
          <PlacePhoto
            photo={photo}
            label={name}
            tone={CATEGORY_TONE[primary]}
            icon={CATEGORY_ICON[primary]}
            iconSize="lg"
            sizes="(min-width: 1152px) 1152px, 100vw"
            priority
            className="aspect-[16/9] w-full sm:aspect-[21/9]"
          />
          <figure className="absolute inset-x-3 bottom-3 flex items-end gap-2.5 sm:inset-x-auto sm:start-5 sm:bottom-5 sm:max-w-md">
            <CharacterAvatar id={character} size="lg" className="shrink-0 shadow-lg" />
            <blockquote className="glass border-border relative rounded-2xl rounded-es-sm border px-4 py-3 shadow-lg">
              <figcaption className="text-primary mb-0.5 flex items-center gap-1.5 text-xs font-bold">
                <Lightbulb className="size-3.5" aria-hidden />
                {t('didYouKnow', { name: tch(`${character}.name`) })}
              </figcaption>
              <p className="type-body-sm" dir="auto">
                {narration}
              </p>
            </blockquote>
          </figure>
        </div>
        <PhotoCredit photo={photo} label={t('photoBy')} className="px-1" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {place.categories.map((c) => (
                <Badge key={c} tone={c === primary ? 'primary' : 'neutral'} className="[&_svg]:size-3.5">
                  <span aria-hidden>{CATEGORY_ICON[c]}</span>
                  {tc(c)}
                </Badge>
              ))}
            </div>
            <h1 className="type-h1">{name}</h1>
            <p className="type-body text-fg-secondary flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" aria-hidden />
              {placeArea(place, locale)}
            </p>
            <p className="type-body-lg" dir="auto">
              {localize(place.summary, locale)}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row lg:hidden">
              <AddToPlanButton place={place} className="sm:flex-1" />
              <AskAboutPlaceButton place={place} onAsk={() => setChatOpen(true)} className="sm:flex-1" />
            </div>
          </header>

          <Section title={t('about')}>
            <p className="type-body text-fg-secondary" dir="auto">
              {localize(place.description, locale)}
            </p>
          </Section>

          {place.history && (
            <Section title={t('history')} icon={<Landmark />}>
              <p className="type-body text-fg-secondary" dir="auto">
                {localize(place.history, locale)}
              </p>
            </Section>
          )}

          {place.tips.length > 0 && (
            <Section title={t('tips')} icon={<Lightbulb />}>
              <ul className="type-body text-fg-secondary list-disc space-y-1.5 ps-5" dir="auto">
                {place.tips.map((tip, i) => (
                  <li key={i}>{localize(tip, locale)}</li>
                ))}
              </ul>
            </Section>
          )}

          <RelatedPlaces ids={place.relatedPlaceIds} />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <div className="hidden flex-col gap-2 lg:flex">
            <AddToPlanButton place={place} />
            <AskAboutPlaceButton place={place} onAsk={() => setChatOpen(true)} />
          </div>

          <dl className="border-border bg-surface flex flex-col divide-y divide-[var(--border)] rounded-xl border">
            {facts.map((f) => (
              <div key={f.label} className="flex items-center gap-3 px-4 py-3">
                <span className="text-fg-muted [&_svg]:size-4" aria-hidden>
                  {f.icon}
                </span>
                <dt className="text-fg-secondary flex-1 text-sm">{f.label}</dt>
                <dd className="text-sm font-bold">{f.value}</dd>
              </div>
            ))}
          </dl>

          {place.openingHours && (
            <div className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-4">
              <span className="flex items-center gap-2 text-sm font-bold">
                <CalendarClock className="text-fg-muted size-4" aria-hidden />
                {t('openingHours')}
              </span>
              <span className="text-sm" dir="auto">
                {localize(place.openingHours.text, locale)}
              </span>
              {place.openingHours.provenance === 'demo' && <DemoBadge label={t('hoursDemo')} className="w-fit" />}
            </div>
          )}

          <div className="border-border bg-surface flex flex-col overflow-hidden rounded-xl border">
            <MapView
              mode="geo"
              label={t('mapLabel', { name })}
              markers={[{ id: place.id, position: place.location, label: name, kind: 'place', icon: CATEGORY_ICON[primary] }]}
              selectedId={place.id}
              className="h-56"
            />
            <p className="type-caption text-fg-muted px-4 py-2">{t('mapCaption')}</p>
          </div>
        </aside>
      </div>
      <PlaceChat place={place} name={name} open={chatOpen} onOpenChange={setChatOpen} />
    </article>
  );
}

/**
 * "Chat about {place}": the corner launcher and the Ask button open the same popup with this
 * place as context (compact ↔ expanded, conversation kept) — no navigation to the Chat page.
 */
function PlaceChat({ place, name, open, onOpenChange }: { place: Place; name: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const dock = useDockTarget({ kind: 'place', id: place.id, name });
  return (
    <>
      <ChatDock open={open} onClose={() => onOpenChange(false)} {...dock} />
      <ChatLauncher label={dock.label} onOpen={() => onOpenChange(true)} hidden={open} />
    </>
  );
}

function BackLink() {
  const t = useTranslations('placeDetails');
  const router = useRouter();
  return (
    <button
      type="button"
      // Back keeps the Discover search, filters and view the visitor came from
      onClick={() => (window.history.length > 1 ? router.back() : router.push('/discover'))}
      className="focus-ring text-fg-secondary hover:text-fg inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium"
    >
      <ArrowLeft className="flip-rtl size-4" aria-hidden />
      {t('backToDiscover')}
    </button>
  );
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="type-h3 flex items-center gap-2">
        {icon && (
          <span className="text-primary [&_svg]:size-5" aria-hidden>
            {icon}
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}

function RelatedPlaces({ ids }: { ids: string[] }) {
  const t = useTranslations('placeDetails');
  const locale = useLocale();
  const router = useRouter();
  const toCard = usePlaceCardData();
  const all = usePlaceSearch({ locale, pageSize: 100 });
  const related = useMemo(() => (all.data?.items ?? []).filter((p) => ids.includes(p.id)), [all.data, ids]);
  if (ids.length === 0 || (!all.isPending && related.length === 0)) return null;

  return (
    <Section title={t('related')}>
      {all.isPending ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {related.map((p) => {
            const card = toCard(p);
            return (
              <li key={p.id}>
                <DestinationCard place={card} onOpen={(id) => router.push(`/discover/${id}`)} openLabel={t('openRelated', { name: card.name })} />
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function DetailsSkeleton() {
  return (
    <div className={cn('mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6')} aria-busy="true">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="aspect-[16/9] w-full rounded-2xl sm:aspect-[21/9]" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
