'use client';

import { CalendarDays, CalendarPlus, Clock, Landmark, ListChecks, MapPin, MessageCircle, Pencil, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AssistantHeader, CharacterAvatar, CharacterCard, type CharacterId } from '@/entities/ai-character';
import { MessageBubble } from '@/entities/conversation';
import { DestinationCard } from '@/entities/place';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
  CardMeta,
  CardSkeleton,
  CardTitle,
  IconButton,
  ImagePlaceholder,
  PriorityBadge,
  toast,
} from '@/shared/ui';
import { DemoBlock, GallerySection } from './section';

export function CardsAvatars() {
  const t = useTranslations('designSystem');
  const tc = useTranslations('designSystem.cardsAvatars');
  const tch = useTranslations('characters');
  const [selectedPlan, setSelectedPlan] = useState<'a' | 'b'>('a');
  const [character, setCharacter] = useState<CharacterId>('arif');

  return (
    <GallerySection id="cards" title={t('sections.cards.title')} description={tc('description')}>
      {/* Card types */}
      <DemoBlock label={tc('types')} className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Destination (standard) */}
        <DestinationCard
          place={{
            id: 'masmak',
            name: tc('destination.name'),
            area: tc('destination.area'),
            region: 'riyadh',
            category: 'heritage',
            categoryLabel: tc('destination.category'),
            summary: tc('destination.summary'),
            duration: tc('destination.duration'),
          }}
          onOpen={() => toast(tc('openedToast'))}
          openLabel={tc('destination.open')}
          action={<IconButton size="icon-sm" variant="secondary" label={tc('addToPlan')} icon={<CalendarPlus aria-hidden />} onClick={() => toast.success(tc('addedToast'))} />}
        />

        {/* Plan card */}
        <Card elevation="raised" interactive>
          <CardHeader className="gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <CardEyebrow className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" aria-hidden />
                {tc('plan.date')}
              </CardEyebrow>
              <Badge tone="warning">{tc('plan.status')}</Badge>
            </div>
            <CardTitle>
              <CardLink onClick={() => toast(tc('openedToast'))}>{tc('plan.title')}</CardLink>
            </CardTitle>
            <CardMeta
              items={[
                { icon: <ListChecks />, label: tc('plan.stops') },
                { icon: <Clock />, label: tc('plan.duration') },
              ]}
            />
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted">{tc('plan.progress')}</span>
              <span className="text-fg font-bold tabular-nums">{tc('plan.progressValue')}</span>
            </div>
            <div className="bg-surface-muted h-1.5 overflow-hidden rounded-full" aria-hidden>
              <div className="bg-cta h-full w-2/5 rounded-full" />
            </div>
          </CardContent>
          <CardFooter className="relative z-10">
            <Button size="sm" variant="gradient">
              <Play className="flip-rtl" aria-hidden />
              {tc('plan.continue')}
            </Button>
            <IconButton size="icon-sm" variant="ghost" label={tc('plan.edit')} icon={<Pencil aria-hidden />} />
          </CardFooter>
        </Card>

        {/* Recommendation (horizontal) */}
        <Card interactive className="flex-row">
          <CardMedia ratio="portrait" className="w-28 shrink-0">
            <ImagePlaceholder label={tc('reco.name')} tone="culture" icon={<Landmark />} iconSize="sm" captionPlacement="none" />
          </CardMedia>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
            <PriorityBadge level="high" />
            <CardTitle className="text-base">
              <CardLink onClick={() => toast(tc('openedToast'))}>{tc('reco.name')}</CardLink>
            </CardTitle>
            <CardDescription className="line-clamp-2">{tc('reco.why')}</CardDescription>
            <CardMeta className="mt-auto" items={[{ icon: <Clock />, label: tc('reco.duration') }]} />
          </div>
        </Card>

        {/* Glass (over map) */}
        <div className="relative overflow-hidden rounded-xl">
          <ImagePlaceholder label={tc('glass.map')} tone="modern" icon={<MapPin />} captionPlacement="none" className="absolute inset-0 size-full" />
          <div className="relative flex h-full min-h-56 items-end p-3">
            <Card elevation="floating" className="w-full">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-base">{tc('glass.title')}</CardTitle>
                <CardDescription>{tc('glass.description')}</CardDescription>
              </CardHeader>
              <CardFooter className="px-4 pt-3 pb-4">
                <Button size="sm">
                  <MessageCircle aria-hidden />
                  {tc('glass.action')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </DemoBlock>

      {/* States */}
      <DemoBlock label={tc('states')} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={tc('selectableLabel')}>
          {(['a', 'b'] as const).map((k) => (
            <Card key={k} interactive selected={selectedPlan === k}>
              <CardContent className="flex items-center gap-3 p-4">
                <CardLink role="radio" aria-checked={selectedPlan === k} onClick={() => setSelectedPlan(k)} className="text-fg flex-1 text-sm font-bold">
                  {tc(`state.option.${k}`)}
                </CardLink>
                {selectedPlan === k && <Badge tone="primary">{tc('state.selected')}</Badge>}
              </CardContent>
            </Card>
          ))}
          <p className="type-caption text-fg-muted">{tc('state.selectableNote')}</p>
        </div>
        <Card disabled>
          <CardHeader>
            <CardTitle className="text-base">{tc('state.disabledTitle')}</CardTitle>
            <CardDescription>{tc('state.disabledBody')}</CardDescription>
          </CardHeader>
          <CardFooter className="pt-4">
            <Button size="sm" variant="secondary" disabled>
              {tc('state.unavailable')}
            </Button>
          </CardFooter>
        </Card>
        <CardSkeleton />
        <div className="flex flex-col gap-2">
          <Card interactive>
            <CardContent className="p-4">
              <CardTitle className="text-base">
                <CardLink onClick={() => toast(tc('openedToast'))}>{tc('state.focusTitle')}</CardLink>
              </CardTitle>
              <CardDescription>{tc('state.focusBody')}</CardDescription>
            </CardContent>
          </Card>
        </div>
      </DemoBlock>

      {/* Avatars */}
      <DemoBlock label={tc('avatarSizes')} className="flex-col items-start gap-4">
        {(['arif', 'roaya'] as const).map((id) => (
          <div key={id} className="flex flex-wrap items-end gap-4">
            {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-1.5">
                <CharacterAvatar id={id} size={size} />
                <code className="text-fg-muted text-[0.6875rem]" dir="ltr">
                  {size}
                </code>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1.5">
              <CharacterAvatar id={id} size="lg" selected />
              <span className="type-caption text-fg-muted">{tc('avatar.selected')}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <CharacterAvatar id={id} size="lg" speaking />
              <span className="type-caption text-fg-muted">{tc('avatar.speaking')}</span>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-4">
          <Avatar alt={tc('userName')} initials={tc('userInitials')} size="md" />
          <Avatar alt={tc('userName')} initials={tc('userInitials')} size="lg" ring="brand" />
          <p className="type-body-sm text-fg-secondary font-normal">{tc('avatar.userNote')}</p>
        </div>
      </DemoBlock>

      <DemoBlock label={tc('avatarContexts')} className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <p className="type-caption text-fg-muted">{tc('context.header')}</p>
          <div className="border-border bg-surface rounded-lg border p-3">
            <AssistantHeader id={character} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="type-caption text-fg-muted">{tc('context.bubble')}</p>
          <MessageBubble role="assistant" author={tch(`${character}.name`)} accent={character} time="09:41" avatar={<CharacterAvatar id={character} size="sm" decorative />}>
            <p>{tc('context.bubbleText')}</p>
          </MessageBubble>
        </div>
        <div className="flex flex-col gap-2">
          <p className="type-caption text-fg-muted">{tc('context.compact')}</p>
          <ul className="border-border bg-surface divide-border flex flex-col divide-y rounded-lg border">
            {(['one', 'two'] as const).map((k, i) => (
              <li key={k} className="flex items-center gap-2.5 px-3 py-2.5 text-sm">
                <CharacterAvatar id={i === 0 ? 'arif' : 'roaya'} size="xs" decorative />
                <span className="truncate">{tc(`context.history.${k}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </DemoBlock>

      <DemoBlock label={tc('picker')} className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
        <div role="radiogroup" aria-label={tc('pickerLabel')} className="contents">
          {(['arif', 'roaya'] as const).map((id) => (
            <CharacterCard key={id} id={id} selected={character === id} onSelect={setCharacter} />
          ))}
        </div>
        <div role="radiogroup" aria-label={tc('pickerCompactLabel')} className="flex flex-col gap-2">
          {(['arif', 'roaya'] as const).map((id) => (
            <CharacterCard key={id} id={id} layout="horizontal" selected={character === id} onSelect={setCharacter} />
          ))}
        </div>
      </DemoBlock>
    </GallerySection>
  );
}
