'use client';

import { Bell, CalendarPlus, Ellipsis, Info, LogOut, MessageCircle, Pencil, Plus, Settings, Trash, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { CharacterAvatar } from '@/entities/ai-character';
import { PlaceDetailCard, type PlaceCardData } from '@/entities/place';
import { cn } from '@/shared/lib';
import {
  Avatar,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  MapMarker,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PriorityBadge,
  Sheet,
  SheetContent,
  SheetTrigger,
  toast,
} from '@/shared/ui';
import { MapPreviewCanvas, OrderLine } from './map-preview-canvas';
import { DemoBlock, GallerySection } from './section';

const STOP_KEYS = ['masmak', 'murabba', 'museum'] as const;
type StopKey = (typeof STOP_KEYS)[number];
const POSITIONS: Record<StopKey, { x: number; y: number }> = {
  masmak: { x: 28, y: 62 },
  murabba: { x: 50, y: 34 },
  museum: { x: 70, y: 52 },
};

function usePlace(key: StopKey): PlaceCardData {
  const t = useTranslations('designSystem.overlayPatterns.places');
  return {
    name: t(`${key}.name`),
    category: t(`${key}.category`),
    area: t(`${key}.area`),
    duration: t(`${key}.duration`),
    summary: t(`${key}.summary`),
    highlights: [t(`${key}.h1`), t(`${key}.h2`), t(`${key}.h3`)],
    priority: key === 'masmak' ? 'high' : key === 'murabba' ? 'recommended' : 'optional',
    hours: t(`${key}.hours`),
  };
}

/** "Ask Arif" + contextual action (D-022). */
function PlaceActions({ context }: { context: 'proposal' | 'discover' }) {
  const t = useTranslations('designSystem.overlayPatterns');
  return (
    <>
      {context === 'discover' ? (
        <Button size="sm" onClick={() => toast.success(t('addedToast'))}>
          <CalendarPlus aria-hidden />
          {t('addToPlan')}
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => toast(t('removedToast'))}>
          <Trash aria-hidden />
          {t('removeFromProposal')}
        </Button>
      )}
      <Button size="sm" variant="secondary" onClick={() => toast(t('askToast'))}>
        <MessageCircle aria-hidden />
        {t('askArif')}
      </Button>
    </>
  );
}

/** Place-detail popup anchored over the map: Esc / ✕ closes and focus returns to the marker. */
function MapWithPlacePopup() {
  const t = useTranslations('designSystem.overlayPatterns');
  const [open, setOpen] = useState<StopKey | null>('masmak');
  const markerRefs = useRef<Partial<Record<StopKey, HTMLButtonElement | null>>>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const masmak = usePlace('masmak');
  const murabba = usePlace('murabba');
  const museum = usePlace('museum');
  const places: Record<StopKey, PlaceCardData> = { masmak, murabba, museum };

  const close = () => {
    const key = open;
    setOpen(null);
    if (key) markerRefs.current[key]?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="@container">
      <MapPreviewCanvas className="h-[38rem]">
        <OrderLine points={STOP_KEYS.map((k) => [POSITIONS[k].x, POSITIONS[k].y])} />
        {STOP_KEYS.map((key, i) => (
          <div
            key={key}
            className="absolute -translate-1/2 rtl:translate-x-1/2"
            style={{ insetInlineStart: `${POSITIONS[key].x}%`, top: `${POSITIONS[key].y}%` }}
          >
            <MapMarker
              ref={(el) => {
                markerRefs.current[key] = el;
              }}
              number={i + 1}
              selected={open === key}
              label={t('stopLabel', { n: i + 1, name: places[key].name })}
              aria-expanded={open === key}
              aria-controls={open === key ? headingId : undefined}
              onClick={() => {
                setOpen(key);
                window.requestAnimationFrame(() => cardRef.current?.focus());
              }}
            />
          </div>
        ))}

        {open && (
          <div
            role="dialog"
            aria-modal="false"
            aria-labelledby={headingId}
            className={cn(
              'absolute z-10 flex',
              'inset-x-3 bottom-3 max-h-[78%]',
              '@3xl:inset-x-auto @3xl:end-4 @3xl:top-4 @3xl:bottom-4 @3xl:max-h-none @3xl:w-[24rem]',
            )}
          >
            <PlaceDetailCard
              ref={cardRef}
              headingId={headingId}
              place={places[open]}
              onClose={close}
              actions={<PlaceActions context="discover" />}
              className="focus-visible:ring-focus/40 w-full outline-none focus-visible:ring-3"
            />
          </div>
        )}
      </MapPreviewCanvas>
    </div>
  );
}

export function OverlayPatterns() {
  const t = useTranslations('designSystem.overlayPatterns');
  const tm = useTranslations('designSystem.chatPatterns');
  const [targetPlan, setTargetPlan] = useState('heritage');
  const [unread, setUnread] = useState(2);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const museum = usePlace('museum');

  const notifications = (['n1', 'n2', 'n3'] as const).map((k, i) => ({
    key: k,
    title: t(`notifications.${k}.title`),
    body: t(`notifications.${k}.body`),
    time: t(`notifications.${k}.time`),
    unread: i < unread,
  }));

  return (
    <GallerySection id="overlayPatterns" title={t('title')} description={t('description')}>
      {/* Modal form + confirmation */}
      <DemoBlock label={t('modals')}>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <CalendarPlus aria-hidden />
              {t('addToPlan')}
            </Button>
          </DialogTrigger>
          <DialogContent
            title={t('pickPlanTitle')}
            description={t('pickPlanDescription')}
            footer={
              <>
                <DialogClose asChild>
                  <Button variant="secondary">{t('cancel')}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => toast.success(t('addedToast'))}>{t('add')}</Button>
                </DialogClose>
              </>
            }
          >
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">{t('pickPlanTitle')}</legend>
              {(['heritage', 'evening', 'new'] as const).map((key) => (
                <label
                  key={key}
                  className={cn(
                    'border-border flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors',
                    targetPlan === key ? 'border-primary/50 bg-selection' : 'hover:bg-surface-muted',
                  )}
                >
                  <input
                    type="radio"
                    name="target-plan"
                    value={key}
                    checked={targetPlan === key}
                    onChange={() => setTargetPlan(key)}
                    className="accent-primary focus-ring size-4"
                  />
                  {key === 'new' && <Plus className="text-primary size-4" aria-hidden />}
                  <span className="flex flex-col">
                    <span className="text-[0.9375rem] font-medium">{t(`plans.${key}.name`)}</span>
                    <span className="type-caption text-fg-muted">{t(`plans.${key}.meta`)}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </DialogContent>
        </Dialog>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent
            closeOnOutsideClick={false}
            title={t('deleteConversationTitle')}
            description={t('deleteConversationDescription')}
            footer={
              <>
                <DialogClose asChild>
                  <Button variant="secondary">{t('cancel')}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="danger" onClick={() => toast.success(t('deletedToast'))}>
                    <Trash aria-hidden />
                    {t('delete')}
                  </Button>
                </DialogClose>
              </>
            }
          >
            <p className="type-body text-fg-secondary">{t('cannotUndo')}</p>
          </DialogContent>
        </Dialog>

        {/* Conversation ⋯ menu — "Delete" opens the confirmation above */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              <Ellipsis aria-hidden />
              {t('conversationMenu')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>{t('conversationName')}</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => toast(t('renameToast'))}>
              <Pencil aria-hidden />
              {t('rename')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => setConfirmOpen(true)}>
              <Trash aria-hidden />
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="focus-ring rounded-full" aria-label={t('userMenu')}>
              <Avatar alt={tm('userName')} initials={tm('userInitials')} size="md" ring="brand" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{tm('userName')}</DropdownMenuLabel>
            <DropdownMenuItem>
              <User aria-hidden />
              {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings aria-hidden />
              {t('settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>
              <LogOut className="flip-rtl" aria-hidden />
              {t('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DemoBlock>

      {/* Popovers */}
      <DemoBlock label={t('popovers')} className="gap-6">
        <div className="flex items-center gap-2">
          <PriorityBadge level="high" />
          <Popover>
            <PopoverTrigger asChild>
              <IconButton size="icon-sm" label={t('whyLabel')} icon={<Info aria-hidden />} />
            </PopoverTrigger>
            <PopoverContent align="start">
              <div className="flex gap-3">
                <CharacterAvatar id="arif" size="sm" decorative />
                <div className="flex flex-col gap-1">
                  <p className="type-h4 text-base">{t('whyTitle')}</p>
                  <p className="type-body text-fg-secondary">{t('whyBody')}</p>
                  <p className="type-caption text-fg-muted mt-1">{t('whyDemoNote')}</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t('notificationsLabel', { count: unread })}
              className="focus-ring border-border bg-surface hover:bg-surface-muted relative grid size-11 cursor-pointer place-items-center rounded-full border"
            >
              <Bell className="size-5" aria-hidden />
              {unread > 0 && (
                <span className="bg-accent-pink text-on-cta absolute -end-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full px-1 text-[0.6875rem] font-bold">
                  {unread}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0">
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <p className="type-h4 text-base">{t('notificationsTitle')}</p>
              <Button variant="link" size="sm" disabled={unread === 0} onClick={() => setUnread(0)}>
                {t('markAllRead')}
              </Button>
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.key} className="border-border flex gap-3 border-b px-4 py-3 last:border-0">
                  <span className={cn('mt-2 size-2 shrink-0 rounded-full', n.unread ? 'bg-accent-pink' : 'bg-transparent')} aria-hidden />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className={cn('text-sm', n.unread ? 'font-bold' : 'font-medium')}>
                      {n.unread && <span className="sr-only">{t('unread')} </span>}
                      {n.title}
                    </p>
                    <p className="type-body-sm text-fg-secondary font-normal">{n.body}</p>
                    <p className="type-caption text-fg-muted">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </DemoBlock>

      {/* Place-detail popup over the map */}
      <DemoBlock label={t('placeOverMap')} className="block p-0 sm:p-0">
        <MapWithPlacePopup />
        <p className="type-caption text-fg-muted border-border border-t px-4 py-2.5">{t('placeOverMapNote')}</p>
      </DemoBlock>

      {/* Mobile bottom sheet with fixed actions */}
      <DemoBlock label={t('bottomSheet')} className="gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">{t('openPlaceSheet')}</Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            title={museum.name}
            hideTitle
            footer={
              <div className="flex w-full gap-2 [&>*]:flex-1">
                <PlaceActions context="discover" />
              </div>
            }
          >
            <PlaceDetailCard variant="embedded" place={museum} actions={null} />
          </SheetContent>
        </Sheet>
        <Button variant="secondary" asChild>
          <a href="#proposal">{t('openProposalSheet')}</a>
        </Button>
        <p className="type-body-sm text-fg-secondary max-w-md font-normal">{t('bottomSheetNote')}</p>
      </DemoBlock>

      {/* Behaviour contract */}
      <DemoBlock label={t('behaviour')} className="block">
        <ul className="type-body text-fg-secondary grid list-disc gap-x-8 gap-y-1.5 ps-5 md:grid-cols-2">
          {(['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'] as const).map((k) => (
            <li key={k}>{t(`rules.${k}`)}</li>
          ))}
        </ul>
      </DemoBlock>
    </GallerySection>
  );
}
