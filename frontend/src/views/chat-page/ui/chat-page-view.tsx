'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, CalendarPlus, ChevronDown, Info, ListChecks, ListOrdered, MapPinned, Route, X, Map as MapIcon, MessageCircle, MessagesSquare, PanelLeftClose, PanelLeftOpen, Shapes, Sparkles, SquarePen } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AssistantHeader, setActiveCharacter, useActiveCharacter, type CharacterId } from '@/entities/ai-character';
import { conversationKeys, conversationRepository, type ItineraryProposal, type MessageBlock } from '@/entities/conversation';
import { PlaceMapPopup, usePlaceDetailData } from '@/entities/place';
import type { ProposalStopContent } from '@/entities/plan';
import { AddToPlanButton } from '@/features/add-to-plan';
import { useSaveChatProposal } from '@/features/save-proposal-to-plans';
import { PlaceSummaryDialog, useChatSession, useStopRefs, type SummaryTarget } from '@/features/send-chat-message';
import { CharacterSwitcher } from '@/features/switch-ai-character';
import { useSubscriptionSnapshot } from '@/entities/subscription';
import { requestSignIn } from '@/shared/lib/auth-gate';
import { localize } from '@/shared/api';
import { Link, usePathname, useRouter } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { useFormatDuration } from '@/shared/lib/use-format-duration';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  IconButton,
  SegmentedControl,
  Sheet,
  SheetContent,
  Skeleton,
} from '@/shared/ui';
import { ChatHistory } from '@/widgets/chat-history';
import { ChatMap, useChatMapItems, type ChatMapSource } from '@/widgets/chat-map';
import { ChatThread } from '@/widgets/chat-thread';
import { ExpoSiteMap } from '@/widgets/expo-site-map';
import { VoiceCompanion, VoiceModeButton } from '@/widgets/voice-companion';
import { ChatWelcome } from '@/widgets/chat-welcome';
import { ProposalSheet } from '@/widgets/proposal-sheet';

/** Space between the app top bar and the phone bottom nav (or the screen bottom on md+). */
const FULL_HEIGHT =
  'h-[calc(100dvh-7.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2px)] md:h-[calc(100dvh-4rem-1px)]';

export function ChatPageView() {
  return (
    <Suspense fallback={<Skeleton className={cn('m-4 rounded-xl', FULL_HEIGHT)} />}>
      <ChatPage />
    </Suspense>
  );
}

type MapFocus = { messageId: string; focusId?: string } | null;

/** The three chat views (?view=): the conversation, the tourism map, and the Expo site plan. */
type ChatView = 'chat' | 'map' | 'expo';
const viewOf = (value: string | null): ChatView => (value === 'map' || value === 'expo' ? value : 'chat');

function findSource(blocks: MessageBlock[]): ChatMapSource | null {
  for (const b of blocks) if (b.type === 'itinerary-proposal') return { kind: 'proposal', proposal: b.proposal };
  for (const b of blocks) if (b.type === 'recommendations') return { kind: 'recommendations', items: b.items };
  return null;
}

/** Chat (PRD §4.1, Screens 1–8): history, conversation, Chat ↔ Map, proposals and saving. */
function ChatPage() {
  const t = useTranslations('chatPage');
  const tc = useTranslations('characters');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const queryClient = useQueryClient();
  const conversationId = search.get('c');
  const view = viewOf(search.get('view'));
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [activeCharacter] = useActiveCharacter();

  const setUrl = useCallback(
    (patch: { c?: string | null; view?: ChatView; place?: string | null }, mode: 'replace' | 'push' = 'replace') => {
      // Start from the URL as it is NOW: async callbacks (a conversation created after a mode switch)
      // must not restore an older ?view=
      const next = new URLSearchParams(typeof window === 'undefined' ? search.toString() : window.location.search);
      if (patch.c !== undefined) {
        if (patch.c) next.set('c', patch.c);
        else next.delete('c');
      }
      if (patch.place !== undefined) {
        if (patch.place) next.set('place', patch.place);
        else next.delete('place');
      }
      if (patch.view !== undefined) {
        if (patch.view === 'chat') next.delete('view');
        else next.set('view', patch.view);
      }
      const qs = next.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (mode === 'push') router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [pathname, router, search],
  );

  // ?place=<placeId> (from the place page's chat shortcut): continue the latest conversation about
  // that place, or start a new one with the place as context — the same context the dock uses.
  const placeParam = conversationId ? null : search.get('place');
  const { resolve } = useStopRefs();
  const contextPlace = placeParam ? resolve({ kind: 'place', placeId: placeParam }) : null;
  const session = useChatSession({
    conversationId,
    characterId: activeCharacter,
    locale,
    // ?planner=1 (plan editor's "Generate with …"): a new conversation in planner context
    context: contextPlace ? { kind: 'place', placeId: contextPlace.id } : !conversationId && search.get('planner') === '1' ? { kind: 'planner' } : undefined,
    onConversationCreated: (c) => setUrl({ c: c.id, place: null }),
  });

  useEffect(() => {
    if (!placeParam) return;
    let cancelled = false;
    void queryClient
      .fetchQuery({
        queryKey: conversationKeys.list({ characterId: activeCharacter }),
        queryFn: ({ signal }) => conversationRepository.list({ characterId: activeCharacter }, signal),
      })
      .then((list) => {
        const existing = list.find((c) => c.context?.kind === 'place' && c.context.placeId === placeParam);
        if (!cancelled && existing) setUrl({ c: existing.id, place: null });
      });
    return () => {
      cancelled = true;
    };
    // Only when arriving with a place (or switching character while it is pending)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeParam, activeCharacter]);
  const character: CharacterId = session.conversation?.characterId ?? activeCharacter;

  // Opening a conversation makes its character active (identity, accent, history filter). Runs only
  // when the open conversation changes — never fights a "Switch to …" that is in progress.
  const openId = session.conversation?.id;
  const openCharacter = session.conversation?.characterId;
  useEffect(() => {
    if (openCharacter) setActiveCharacter(openCharacter);
  }, [openId, openCharacter]);

  // "Switch to Roaya" opens Roaya's most recent conversation, or a new one (PRD §4.1)
  const switchCharacter = async (next: CharacterId) => {
    setActiveCharacter(next);
    const list = await queryClient.fetchQuery({
      queryKey: conversationKeys.list({ characterId: next }),
      queryFn: ({ signal }) => conversationRepository.list({ characterId: next }, signal),
    });
    setUrl({ c: list[0]?.id ?? null });
  };

  // History: side panel on lg+, drawer below
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [historyDrawer, setHistoryDrawer] = useState(false);

  // Map: by default the latest proposal / recommendations; "Show on map" focuses a message + item
  const [mapFocus, setMapFocus] = useState<MapFocus>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const source = useMemo<ChatMapSource | null>(() => {
    const messages = session.messages;
    const focused = mapFocus && messages.find((m) => m.id === mapFocus.messageId);
    if (focused) return findSource(focused.blocks);
    for (const m of [...messages].reverse()) {
      const s = findSource(m.blocks);
      if (s) return s;
    }
    return null;
  }, [session.messages, mapFocus]);

  const showOnMap = (messageId: string, focusId?: string) => {
    setMapFocus({ messageId, focusId });
    setSelectedId(focusId ?? null);
    setUrl({ view: 'map' }, 'push');
  };

  // Proposal review sheet
  const [reviewing, setReviewing] = useState<string | null>(null);
  const reviewProposal = useMemo(() => {
    const message = reviewing ? session.messages.find((m) => m.id === reviewing) : null;
    const block = message?.blocks.find((b) => b.type === 'itinerary-proposal');
    return block?.type === 'itinerary-proposal' ? block.proposal : null;
  }, [reviewing, session.messages]);

  const openPlan = (planId: string) => router.push(`/plans/${planId}`);
  const [summary, setSummary] = useState<SummaryTarget | null>(null);
  const name = tc(`${character}.name`);

  const history = (
    <ChatHistory
      character={character}
      activeId={session.conversation?.id ?? null}
      onOpen={(c) => {
        setActiveCharacter(c.characterId);
        setMapFocus(null);
        setUrl({ c: c.id });
        setHistoryDrawer(false);
      }}
      onNew={() => {
        setMapFocus(null);
        setUrl({ c: null, view: 'chat' });
        setHistoryDrawer(false);
      }}
      onDeletedActive={() => setUrl({ c: null })}
      className="h-full"
    />
  );

  const hasConversation = Boolean(session.conversation) || session.busy;
  /** Mode bar: a new history entry per switch; ?c= (conversation) and the locale are kept */
  const switchView = (next: ChatView) => {
    if (next !== view) setUrl({ view: next }, 'push');
  };
  /** "Plan a trip → Ask {name}": back to the conversation, then the request is sent there */
  const askForPlan = (prompt: string) => {
    if (view !== 'chat') setUrl({ view: 'chat' }, 'push');
    void session.send(prompt);
  };
  const thread = (compact: boolean) => (
    <ChatThread
      session={session}
      character={character}
      compact={compact}
      onShowOnMap={showOnMap}
      onReviewProposal={setReviewing}
      onOpenPlan={openPlan}
      welcome={
        compact ? undefined : (
          <ChatWelcome
            character={character}
            onCharacterChange={(c) => void switchCharacter(c)}
            onSend={(text) => void session.send(text)}
            headerActions={<VoiceModeButton onClick={() => setVoiceOpen(true)} />}
            className="flex-1"
          />
        )
      }
    />
  );

  return (
    <div className={cn('flex min-h-0', FULL_HEIGHT)}>
      {/* History panel (lg+) */}
      {!historyCollapsed && <aside className="border-border bg-surface hidden w-72 shrink-0 border-e lg:block">{history}</aside>}

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Modes: Chat with {name} · Explore Map · Expo Map, plus trip planning */}
        <ModeBar view={view} characterName={name} onChange={switchView} onAskForPlan={askForPlan} />

        {/* Toolbar */}
        <div className="border-border bg-surface flex shrink-0 items-center gap-2 border-b px-3 py-2 sm:px-4">
          <IconButton
            size="icon-sm"
            variant="ghost"
            className="lg:hidden"
            label={t('history')}
            icon={<MessagesSquare aria-hidden />}
            onClick={() => setHistoryDrawer(true)}
          />
          <IconButton
            size="icon-sm"
            variant="ghost"
            className="hidden lg:grid"
            label={historyCollapsed ? t('showHistory') : t('hideHistory')}
            icon={historyCollapsed ? <PanelLeftOpen className="flip-rtl" aria-hidden /> : <PanelLeftClose className="flip-rtl" aria-hidden />}
            onClick={() => setHistoryCollapsed((c) => !c)}
            aria-expanded={!historyCollapsed}
          />
          <div className="min-w-0 flex-1">
            {hasConversation ? (
              <AssistantHeader id={character} className="min-w-0" />
            ) : contextPlace ? (
              <span className="bg-primary-tint text-primary inline-flex max-w-full items-center gap-1.5 rounded-full py-1 ps-2.5 pe-1 text-xs font-bold">
                <MapPinned className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{t('aboutPlace', { place: contextPlace.name })}</span>
                <button
                  type="button"
                  onClick={() => setUrl({ place: null })}
                  aria-label={t('removePlaceContext')}
                  className="focus-ring hover:bg-primary/15 grid size-6 shrink-0 place-items-center rounded-full"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </span>
            ) : (
              <span className="text-fg-secondary truncate text-sm font-medium">{t('newWith', { name })}</span>
            )}
          </div>
          {hasConversation && <VoiceModeButton compact onClick={() => setVoiceOpen(true)} />}
          {hasConversation && <CharacterSwitcher active={character} onSwitch={(c) => void switchCharacter(c)} className="hidden sm:inline-flex" />}
          {hasConversation && (
            <IconButton size="icon-sm" variant="secondary" label={t('newConversation')} icon={<SquarePen aria-hidden />} onClick={() => setUrl({ c: null, view: 'chat' })} />
          )}
        </div>

        {/* Body */}
        {session.loadError && view === 'chat' ? (
          <EmptyState
            icon={<MessagesSquare />}
            title={t('notFoundTitle')}
            description={t('notFoundDescription')}
            action={<Button onClick={() => setUrl({ c: null })}>{t('newConversation')}</Button>}
          />
        ) : view === 'chat' ? (
          thread(false)
        ) : view === 'expo' ? (
          <ExpoView thread={session.loadError ? null : thread(true)} onBackToChat={() => switchView('chat')} />
        ) : (
          <MapMode
            source={source}
            selectedId={selectedId}
            onSelect={setSelectedId}
            focusMode={focusMode}
            onFocusMode={setFocusMode}
            thread={thread(true)}
            onBack={() => switchView('chat')}
            onDetails={setSummary}
            onOpenExpo={() => switchView('expo')}
            onAsk={(placeName) => {
              setSelectedId(null);
              void session.send(t('askAboutStop', { name: placeName }));
            }}
          />
        )}
      </div>

      <PlaceSummaryDialog target={summary} onOpenChange={(o) => !o && setSummary(null)} />
      {/* Voice conversation (design-system "Talk to … with voice"): browser speech, demo replies */}
      <VoiceCompanion open={voiceOpen} onOpenChange={setVoiceOpen} character={character} onCharacterChange={(c) => void switchCharacter(c)} />

      {/* History drawer (< lg) */}
      <Sheet open={historyDrawer} onOpenChange={setHistoryDrawer}>
        <SheetContent side="start" title={t('history')}>
          {history}
        </SheetContent>
      </Sheet>

      {reviewProposal && session.conversation && (
        <ProposalReview
          key={`${reviewProposal.id}:${reviewProposal.savedPlanId ?? ''}`}
          conversationId={session.conversation.id}
          proposal={reviewProposal}
          onClose={() => setReviewing(null)}
          onOpenPlan={openPlan}
          onAsk={(stopName) => {
            setReviewing(null);
            void session.send(t('askAboutStop', { name: stopName }));
          }}
        />
      )}
    </div>
  );
}

/**
 * Mode bar at the top of Chat: Chat with {name} · Explore Map · Expo Map (the selected mode follows
 * ?view=; the conversation stays in ?c=), and "Plan a trip" — ask the companion for a plan (demo
 * proposals from the guide data, reviewed before saving) or build one in My Plans.
 */
function ModeBar({
  view,
  characterName,
  onChange,
  onAskForPlan,
}: {
  view: ChatView;
  characterName: string;
  onChange: (view: ChatView) => void;
  onAskForPlan: (prompt: string) => void;
}) {
  const t = useTranslations('chatPage');
  const router = useRouter();
  return (
    <div className="border-border bg-surface flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4">
      <SegmentedControl
        label={t('viewLabel')}
        value={view}
        onValueChange={onChange}
        className="min-w-0 flex-1 sm:flex-none [&>*]:flex-1 sm:[&>*]:flex-none"
        options={[
          { value: 'chat', label: t('modes.chat', { name: characterName }), icon: <MessageCircle aria-hidden /> },
          { value: 'map', label: t('modes.map'), icon: <MapIcon aria-hidden /> },
          { value: 'expo', label: t('modes.expo'), icon: <Shapes aria-hidden /> },
        ]}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="secondary" className="ms-auto shrink-0">
            <Route aria-hidden />
            {t('planTrip.button')}
            <ChevronDown aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-64">
          <DropdownMenuLabel className="type-caption text-fg-muted font-normal">{t('planTrip.demoNote')}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => onAskForPlan(t('planTrip.riyadhPrompt'))}>
            <Sparkles aria-hidden />
            {t('planTrip.askRiyadh', { name: characterName })}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAskForPlan(t('planTrip.expoPrompt'))}>
            <Shapes aria-hidden />
            {t('planTrip.askExpo', { name: characterName })}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push('/plans/new')}>
            <CalendarPlus aria-hidden />
            {t('planTrip.createMyself')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/plans')}>
            <ListChecks aria-hidden />
            {t('planTrip.myPlans')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Expo Map inside Chat: the same dedicated site-plan widget as the Expo page (illustrative layout,
 * local coordinates — never mixed with the tourism map), with a link to the full Expo page.
 */
function ExpoView({ thread, onBackToChat }: { thread: ReactNode; onBackToChat: () => void }) {
  const t = useTranslations('chatPage');
  const te = useTranslations('expoPage');
  return (
    <div className="@container flex min-h-0 flex-1">
      {/* Wide screens: the conversation stays open beside the Expo map */}
      {thread && (
        <section aria-label={t('chatPanel')} className="border-border bg-surface-elevated hidden w-[min(26rem,40%)] min-w-[22rem] shrink-0 flex-col border-e @5xl:flex">
          {thread}
        </section>
      )}
      {/* The Expo map fills the view (P-023); header and disclaimer stay compact */}
      <div className="bg-page flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="type-h4">{t('expoTitle')}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" className="@5xl:hidden" onClick={onBackToChat}>
              <MessageCircle aria-hidden />
              {t('backToConversation')}
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/expo">
                {t('openExpoPage')}
                <ArrowUpRight className="flip-rtl" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
        <p role="note" className="border-warning/40 bg-warning-tint text-warning-fg flex items-start gap-2 rounded-lg border px-3 py-1.5 text-xs">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {te('disclaimer')}
        </p>
        <ExpoSiteMap className="min-h-[26rem] flex-1" />
      </div>
    </div>
  );
}

/** Map mode (PRD §4.1, Screen 7): the chat floats over the map; focus mode shows only the stops. */
function MapMode({
  source,
  selectedId,
  onSelect,
  focusMode,
  onFocusMode,
  thread,
  onBack,
  onDetails,
  onOpenExpo,
  onAsk,
}: {
  source: ChatMapSource | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  focusMode: boolean;
  onFocusMode: (on: boolean) => void;
  thread: ReactNode;
  onBack: () => void;
  onDetails: (target: SummaryTarget) => void;
  onOpenExpo: () => void;
  onAsk: (placeName: string) => void;
}) {
  const t = useTranslations('chatPage');
  const router = useRouter();
  const formatDuration = useFormatDuration();
  const toDetail = usePlaceDetailData();
  const mapItems = useChatMapItems(source);
  // The Map view is the tourism map only; Expo pavilions are shown in the Expo Map view
  const expoOnly = mapItems.type === 'expo';
  const items = expoOnly ? [] : mapItems.items;
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const selectedPlace = selected?.stop.kind === 'place' ? selected.stop.place : null;

  return (
    <div className="@container relative min-h-0 flex-1">
      <ChatMap
        source={source}
        selectedId={selectedId}
        onSelect={onSelect}
        tourismOnly
        expoNotice={
          <div className="bg-surface/95 border-border flex max-w-sm flex-col items-center gap-2 rounded-xl border px-4 py-3 text-center text-sm shadow-md">
            <p>{t('expoOnMapNotice')}</p>
            <Button size="sm" onClick={onOpenExpo}>
              <Shapes aria-hidden />
              {t('expoView')}
            </Button>
          </div>
        }
        className="absolute inset-0"
      />
      {items.length > 0 && !selectedPlace && (
        <div className="absolute end-3 top-14 z-10 flex max-w-[min(22rem,calc(100%-1.5rem))] justify-end" aria-live="polite">
          <p className="bg-surface/95 border-border text-fg-secondary rounded-full border px-3 py-1.5 text-xs shadow-sm">{t('selectForDetails')}</p>
        </div>
      )}
      {/* Place details over the map (design system): the same card as Discover; the map keeps its view */}
      {selectedPlace && !focusMode && (
        <PlaceMapPopup
          place={toDetail(selectedPlace)}
          onClose={() => onSelect(null)}
          className="@3xl:start-auto"
          actions={
            <div className="flex w-full flex-wrap gap-2 [&>*]:flex-1">
              <Button size="sm" onClick={() => router.push(`/discover/${selectedPlace.id}`)}>
                <Info aria-hidden />
                {t('openFullDetails')}
              </Button>
              <AddToPlanButton place={selectedPlace} variant="secondary" />
              <Button size="sm" variant="ghost" onClick={() => onAsk(selected!.stop.name)}>
                <MessageCircle aria-hidden />
                {t('askAboutIt')}
              </Button>
            </div>
          }
        />
      )}
      <section
        aria-label={focusMode ? t('stopsPanel') : t('chatPanel')}
        className={cn(
          'border-border bg-surface-elevated absolute z-10 flex flex-col overflow-hidden border shadow-lg',
          'inset-x-0 bottom-0 rounded-t-xl',
          focusMode ? 'max-h-[45%]' : 'h-[58%]',
          '@3xl:inset-x-auto @3xl:start-4 @3xl:top-4 @3xl:bottom-4 @3xl:h-auto @3xl:max-h-none @3xl:w-[min(26rem,42%)] @3xl:min-w-[22rem] @3xl:rounded-xl',
          focusMode && '@3xl:bottom-auto',
        )}
      >
        <div className="border-border flex items-center justify-between gap-2 border-b px-3 py-2">
          {focusMode ? (
            <Button size="sm" variant="ghost" onClick={() => onFocusMode(false)}>
              <ArrowLeft className="flip-rtl" aria-hidden />
              {t('backToConversation')}
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={onBack}>
              <MessageCircle aria-hidden />
              {t('chatView')}
            </Button>
          )}
          {!focusMode && items.length > 0 && (
            <Button size="sm" variant="secondary" onClick={() => onFocusMode(true)}>
              <ListOrdered aria-hidden />
              {t('focusMap')}
            </Button>
          )}
        </div>
        {focusMode ? (
          <ol className="flex min-h-0 flex-col gap-1.5 overflow-y-auto p-3">
            {items.map(({ id, number, stop }) => {
              const isSelected = id === selectedId;
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    aria-expanded={isSelected}
                    onClick={() => onSelect(isSelected ? null : id)}
                    className={cn('focus-ring border-border flex w-full flex-col gap-1 rounded-md border p-2.5 text-start', isSelected ? 'bg-selection border-primary/40' : 'hover:bg-surface-muted')}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="bg-primary-tint text-primary grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums">
                        {stop.kind === 'booth' ? <span dir="ltr">{stop.number}</span> : number}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{stop.name}</span>
                    </span>
                    {/* Only the selected stop is expanded (A6, D-020) */}
                    {isSelected && (
                      <span className="type-caption text-fg-secondary ps-9.5">
                        {stop.area} · {formatDuration(stop.durationMin)}
                        <br />
                        {stop.summary}
                      </span>
                    )}
                  </button>
                  {isSelected && (
                    <Button size="sm" variant="ghost" className="ms-8 mt-1" onClick={() => onDetails({ kind: stop.kind, id: stop.id })}>
                      <Info aria-hidden />
                      {t('placeDetails')}
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">{thread}</div>
        )}
      </section>
    </div>
  );
}

/** The approved proposal sheet, connected to real data, the real map and the idempotent save. */
function ProposalReview({
  conversationId,
  proposal,
  onClose,
  onOpenPlan,
  onAsk,
}: {
  conversationId: string;
  proposal: ItineraryProposal;
  onClose: () => void;
  onOpenPlan: (planId: string) => void;
  onAsk: (stopName: string) => void;
}) {
  const t = useTranslations('chatPage');
  const locale = useLocale();
  const { resolve } = useStopRefs();
  const save = useSaveChatProposal();
  const signedIn = useSubscriptionSnapshot().subscription !== null;

  const ordered = proposal.stops.filter((s) => s.kept).sort((a, b) => a.order - b.order);
  const content: ProposalStopContent[] = ordered.flatMap((s) => {
    const stop = resolve(s.ref);
    if (!stop) return [];
    return [
      {
        id: stop.id,
        kind: 'visit' as const,
        durationMin: s.durationMin,
        priority: s.priority,
        position: { x: 0, y: 0 }, // the real map below replaces the illustrative preview
        name: stop.kind === 'booth' ? `${stop.number} · ${stop.name}` : stop.name,
        area: stop.area,
        summary: stop.summary,
        context: localize(s.reason, locale),
        tips: stop.kind === 'place' ? stop.place.tips.map((tip) => localize(tip, locale)) : [],
      },
    ];
  });
  const dataById = new Map(ordered.map((s) => [s.ref.kind === 'place' ? s.ref.placeId : s.ref.boothId, s]));

  return (
    <ProposalSheet
      open
      onOpenChange={(o) => !o && onClose()}
      meta={{
        id: proposal.id,
        title: localize(proposal.title, locale),
        description: localize(proposal.rationale, locale),
        tripType: proposal.type,
        startTime: proposal.startTime,
        bufferMin: proposal.bufferMin,
      }}
      stops={content}
      mapLabel={t('routeMapLabel')}
      savedPlanId={proposal.savedPlanId ?? null}
      onOpenPlan={onOpenPlan}
      onAskAbout={(id) => {
        const stop = content.find((s) => s.id === id);
        if (stop) onAsk(stop.name);
      }}
      onSave={async (stops) => {
        if (!signedIn && !(await requestSignIn())) return null;
        const keptStops = stops.map((s) => dataById.get(s.id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
        const plan = await save.mutateAsync({ conversationId, proposal, keptStops, locale });
        return plan.id;
      }}
      renderRouteMap={(scheduled) => (
        <ChatMap
          source={{
            kind: 'proposal',
            proposal: {
              ...proposal,
              stops: scheduled
                .map((s) => dataById.get(s.id))
                .filter((s): s is NonNullable<typeof s> => Boolean(s))
                .map((s, order) => ({ ...s, order, kept: true })),
            },
          }}
          selectedId={null}
          onSelect={() => undefined}
          className="border-border h-48 overflow-hidden rounded-lg border"
        />
      )}
    />
  );
}
