'use client';

import {
  Map as MapIcon,
  MessageCircle,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
} from 'lucide-react';
import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AssistantHeader, CHARACTERS, CharacterAvatar, type CharacterId } from '@/entities/ai-character';
import { MessageBubble, TypingIndicator } from '@/entities/conversation';
import { SpeakButton } from '@/features/listen-to-message';
import { Composer } from '@/features/send-chat-message';
import { CharacterSwitcher } from '@/features/switch-ai-character';
import { cn } from '@/shared/lib';
import {
  SpeechServicesProvider,
  createSimulatedSpeechInput,
  createSimulatedSpeechOutput,
  type SimulatedInputScenario,
} from '@/shared/lib/speech';
import { Avatar, Button, DemoBadge, IconButton, Label, MapMarker, SegmentedControl, Switch } from '@/shared/ui';
import { ChatWelcome } from '@/widgets/chat-welcome';
import { VoiceCompanion, VoiceModeButton } from '@/widgets/voice-companion';
import { MapPreviewCanvas, OrderLine } from './map-preview-canvas';
import { DemoBlock, GallerySection } from './section';

type LiveMessage = { id: string; role: 'user' | 'assistant'; text: string; time: Date };

const BASE_TIME = new Date(2026, 9, 11, 9, 41);
const MARKERS: { n: 1 | 2 | 3; x: number; y: number }[] = [
  { n: 1, x: 22, y: 30 },
  { n: 2, x: 40, y: 58 },
  { n: 3, x: 63, y: 40 },
];

function useTime() {
  const format = useFormatter();
  return (d: Date) => format.dateTime(d, { hour: 'numeric', minute: '2-digit', numberingSystem: 'latn' });
}

function UserAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const t = useTranslations('designSystem.chatPatterns');
  return <Avatar alt={t('userName')} initials={t('userInitials')} size={size} />;
}

/** The sample conversation: question → long structured answer (with listen control) → follow-up. */
function SampleConversation({ id, showError, compact = false }: { id: CharacterId; showError: boolean; compact?: boolean }) {
  const t = useTranslations('designSystem.chatPatterns');
  const tc = useTranslations('characters');
  const time = useTime();
  const name = tc(`${id}.name`);
  const avatarSize = compact ? 'sm' : 'md';
  const answerText = [
    t('answerIntro'),
    `${t('answerStop1Title')} — ${t('answerStop1Body')}`,
    `${t('answerStop2Title')} — ${t('answerStop2Body')}`,
    `${t('answerStop3Title')} — ${t('answerStop3Body')}`,
    t('answerOutro'),
  ].join('\n');

  return (
    <div className="flex flex-col gap-5">
      <MessageBubble role="user" author={t('you')} time={time(BASE_TIME)} avatar={<UserAvatar size={avatarSize} />}>
        <p>{t('userQuestion')}</p>
      </MessageBubble>
      <MessageBubble
        role="assistant"
        author={name}
        accent={id}
        time={time(new Date(BASE_TIME.getTime() + 60_000))}
        avatar={<CharacterAvatar id={id} size={avatarSize} decorative />}
        footer={<SpeakButton messageId={`sample-${id}-${compact ? 'c' : 'f'}`} text={answerText} character={id} characterName={name} />}
      >
        <p>{t('answerIntro')}</p>
        <ol>
          {([1, 2, 3] as const).map((n) => (
            <li key={n}>
              <strong>{t(`answerStop${n}Title`)}</strong> — {t(`answerStop${n}Body`)}
            </li>
          ))}
        </ol>
        <p>{t('answerOutro')}</p>
      </MessageBubble>
      <MessageBubble
        role="user"
        author={t('you')}
        time={time(new Date(BASE_TIME.getTime() + 180_000))}
        avatar={<UserAvatar size={avatarSize} />}
        status={showError ? 'error' : 'done'}
        onRetry={() => undefined}
      >
        <p>{t('followUp')}</p>
      </MessageBubble>
      {!showError && <TypingIndicator author={name} avatar={<CharacterAvatar id={id} size={avatarSize} decorative />} />}
    </div>
  );
}

/**
 * A self-contained chat surface: welcome (empty) → active conversation.
 * Used twice in the gallery — a wide frame and a phone frame — to show both layouts.
 */
function ChatDemoFrame({ variant }: { variant: 'wide' | 'phone' }) {
  const t = useTranslations('designSystem.chatPatterns');
  const tc = useTranslations('characters');
  const time = useTime();
  const [character, setCharacter] = useState<CharacterId>('arif');
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const name = tc(`${character}.name`);
  const phone = variant === 'phone';
  const [voiceOpen, setVoiceOpen] = useState(false);
  const voiceButton = <VoiceModeButton compact={phone} onClick={() => setVoiceOpen(true)} />;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const send = (text: string) => {
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text, time: new Date() }]);
    setThinking(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setThinking(false);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'assistant', text: t('previewReply', { name }), time: new Date() }]);
    }, 1400);
  };

  const body =
    messages.length === 0 ? (
      <ChatWelcome character={character} onCharacterChange={setCharacter} onSend={send} headerActions={voiceButton} className="flex-1" />
    ) : (
      // Active conversation: plain surface, compact header, no hero — clearly different from the welcome
      <div className="bg-background flex min-h-0 flex-1 flex-col">
        <div className="border-border bg-surface flex items-center gap-2 border-b px-3 py-2.5 sm:px-4">
          <AssistantHeader id={character} className="min-w-0 flex-1" />
          <IconButton
            size="icon-sm"
            variant="secondary"
            label={t('newConversation')}
            icon={<SquarePen aria-hidden />}
            onClick={() => setMessages([])}
          />
          {voiceButton}
        </div>
        <div className={cn('flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto py-5', phone ? 'px-3' : 'px-4 sm:px-8')} aria-live="polite">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                author={m.role === 'user' ? t('you') : name}
                accent={character}
                time={time(m.time)}
                avatar={m.role === 'user' ? <UserAvatar size={phone ? 'sm' : 'md'} /> : <CharacterAvatar id={character} size={phone ? 'sm' : 'md'} decorative />}
                footer={
                  m.role === 'assistant' ? (
                    <SpeakButton messageId={m.id} text={m.text} character={character} characterName={name} />
                  ) : undefined
                }
              >
                <p>{m.text}</p>
              </MessageBubble>
            ))}
            {thinking && <TypingIndicator author={name} avatar={<CharacterAvatar id={character} size={phone ? 'sm' : 'md'} decorative />} />}
          </div>
        </div>
        <div className="border-border bg-background border-t px-3 py-3 sm:px-4">
          <Composer className="mx-auto w-full max-w-3xl" characterName={name} onSend={send} disabled={thinking} hideDisclaimer={phone} />
        </div>
      </div>
    );

  const companion = (
    <VoiceCompanion open={voiceOpen} onOpenChange={setVoiceOpen} character={character} onCharacterChange={setCharacter} />
  );

  if (!phone) {
    return (
      <div className="border-border flex h-[46rem] flex-col overflow-hidden rounded-lg border">
        {body}
        {companion}
      </div>
    );
  }

  return (
    <div className="border-border-strong bg-background relative flex h-[50rem] w-full max-w-[24.375rem] flex-col overflow-hidden rounded-[2.5rem] border-[6px] shadow-lg">
      <header className="border-border bg-surface flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
        <IconButton size="icon-sm" label={t('history')} icon={<MessagesSquare aria-hidden />} />
        <SegmentedControl
          label={t('viewLabel')}
          value="chat"
          onValueChange={() => undefined}
          iconOnly
          options={[
            { value: 'chat', label: t('chatTab'), icon: <MessageCircle aria-hidden /> },
            { value: 'map', label: t('mapTab'), icon: <MapIcon aria-hidden /> },
          ]}
        />
        <Image src="/images/brand/logo.svg" alt="" width={36} height={29} />
      </header>
      {body}
      <BottomNavPreview />
      {companion}
    </div>
  );
}

/** Bottom navigation preview (the real component is built in Phase 3, D-014). */
function BottomNavPreview() {
  const t = useTranslations('designSystem.chatPatterns');
  return (
    <nav aria-label={t('bottomNavPreview')} className="border-border bg-surface grid h-16 shrink-0 grid-cols-5 border-t">
      {(['chat', 'discover', 'expo', 'plans', 'profile'] as const).map((key) => (
        <span
          key={key}
          className={cn('flex flex-col items-center justify-center gap-0.5 text-[0.6875rem]', key === 'chat' ? 'text-primary font-bold' : 'text-fg-muted')}
        >
          <span className={cn('grid h-7 w-12 place-items-center rounded-full', key === 'chat' && 'bg-primary-tint')}>
            <span className={cn('size-2 rounded-full', key === 'chat' ? 'bg-cta' : 'bg-border-strong')} />
          </span>
          {t(`nav.${key}`)}
        </span>
      ))}
    </nav>
  );
}

const INPUT_SCENARIOS = ['success', 'permission-denied', 'unsupported', 'no-speech'] as const satisfies readonly SimulatedInputScenario[];
type GalleryInputScenario = (typeof INPUT_SCENARIOS)[number];

/** Voice demos: live browser voice + simulated scenarios for states a browser can't show on demand. */
function VoiceDemos() {
  const tv = useTranslations('designSystem.voice');
  const tc = useTranslations('characters');
  const [inputScenario, setInputScenario] = useState<GalleryInputScenario>('success');
  const [outputScenario, setOutputScenario] = useState<'success' | 'unsupported' | 'no-voice'>('success');
  const simulatedInput = useMemo(() => createSimulatedSpeechInput(inputScenario, tv('simulatedTranscript')), [inputScenario, tv]);
  const simulatedOutput = useMemo(() => createSimulatedSpeechOutput(outputScenario), [outputScenario]);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const arifName = tc('arif.name');
  const roayaName = tc('roaya.name');

  return (
    <>
      <DemoBlock label={tv('liveInput')} className="flex-col items-stretch gap-3">
        <Composer characterName={arifName} onSend={setLastSent} hideDisclaimer />
        <p className="type-body-sm text-fg-secondary font-normal">{tv('liveInputNote')}</p>
        {lastSent && (
          <p className="type-caption text-fg-muted" aria-live="polite">
            {tv('lastSent', { text: lastSent })}
          </p>
        )}
      </DemoBlock>

      <DemoBlock label={tv('simulatedInput')} className="flex-col items-stretch gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <DemoBadge label={tv('simulated')} />
          <SegmentedControl
            label={tv('scenario')}
            value={inputScenario}
            onValueChange={setInputScenario}
            options={INPUT_SCENARIOS.map((s) => ({ value: s, label: tv(`inputScenarios.${s}`) }))}
          />
        </div>
        <SpeechServicesProvider input={simulatedInput}>
          <div data-testid="simulated-voice-input">
            <Composer key={inputScenario} characterName={arifName} onSend={setLastSent} hideDisclaimer />
          </div>
        </SpeechServicesProvider>
        <p className="type-body-sm text-fg-secondary font-normal">{tv('simulatedInputNote')}</p>
      </DemoBlock>

      <DemoBlock label={tv('liveOutput')} className="flex-col items-stretch gap-5">
        <p className="type-body-sm text-fg-secondary font-normal">{tv('liveOutputNote')}</p>
        <MessageBubble
          role="assistant"
          author={arifName}
          accent="arif"
          time="09:42"
          avatar={<CharacterAvatar id="arif" decorative />}
          footer={<SpeakButton messageId="live-ar" text={tv('sampleArabic')} character="arif" characterName={arifName} />}
        >
          <p dir="rtl" lang="ar">
            {tv('sampleArabic')}
          </p>
        </MessageBubble>
        <MessageBubble
          role="assistant"
          author={roayaName}
          accent="roaya"
          time="09:43"
          avatar={<CharacterAvatar id="roaya" decorative />}
          footer={<SpeakButton messageId="live-en" text={tv('sampleEnglish')} character="roaya" characterName={roayaName} />}
        >
          <p dir="ltr" lang="en">
            {tv('sampleEnglish')}
          </p>
        </MessageBubble>
      </DemoBlock>

      <DemoBlock label={tv('simulatedOutput')} className="flex-col items-stretch gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <DemoBadge label={tv('simulated')} />
          <SegmentedControl
            label={tv('scenario')}
            value={outputScenario}
            onValueChange={setOutputScenario}
            options={(['success', 'unsupported', 'no-voice'] as const).map((s) => ({ value: s, label: tv(`outputScenarios.${s}`) }))}
          />
        </div>
        <SpeechServicesProvider output={simulatedOutput}>
          <div className="flex flex-col gap-5" data-testid="simulated-voice-output">
            {(['one', 'two'] as const).map((k, i) => {
              const id: CharacterId = i === 0 ? 'arif' : 'roaya';
              const nm = tc(`${id}.name`);
              return (
                <MessageBubble
                  key={k}
                  role="assistant"
                  author={nm}
                  accent={id}
                  time={i === 0 ? '09:44' : '09:45'}
                  avatar={<CharacterAvatar id={id} decorative />}
                  footer={<SpeakButton messageId={`sim-${k}`} text={tv(`simulatedMessage.${k}`)} character={id} characterName={nm} />}
                >
                  <p>{tv(`simulatedMessage.${k}`)}</p>
                </MessageBubble>
              );
            })}
          </div>
        </SpeechServicesProvider>
        <p className="type-body-sm text-fg-secondary font-normal">{tv('simulatedOutputNote')}</p>
      </DemoBlock>

      <DemoBlock label={tv('capabilities')} className="block">
        <ul className="type-body text-fg-secondary grid list-disc gap-x-8 gap-y-1.5 ps-5 md:grid-cols-2">
          {(['c1', 'c2', 'c3', 'c4', 'c5', 'c6'] as const).map((k) => (
            <li key={k}>{tv(`capabilityNotes.${k}`)}</li>
          ))}
        </ul>
      </DemoBlock>
    </>
  );
}

export function ChatPatterns() {
  const t = useTranslations('designSystem.chatPatterns');
  const tc = useTranslations('characters');
  const time = useTime();
  const [character, setCharacter] = useState<CharacterId>('arif');
  const [showError, setShowError] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [selectedStop, setSelectedStop] = useState<1 | 2 | 3>(2);
  const name = tc(`${character}.name`);
  const switcher = <CharacterSwitcher active={character} onSwitch={setCharacter} />;

  return (
    <GallerySection id="chat" title={t('title')} description={t('description')}>
      {/* 1 — Identity & switching */}
      <DemoBlock label={t('identity')} className="gap-6">
        {(['arif', 'roaya'] as const).map((id) => (
          <div key={id} className="flex items-center gap-3">
            <CharacterAvatar id={id} size="xl" />
            <div className="flex flex-col">
              <span className={cn('type-h3', CHARACTERS[id].accent.text)}>{tc(`${id}.name`)}</span>
              <span className="type-body-sm text-fg-secondary max-w-56 font-normal">{tc(`${id}.role`)}</span>
            </div>
          </div>
        ))}
        <div className="ms-auto flex flex-col items-start gap-2">
          <span className="type-caption text-fg-muted">{t('switchHint')}</span>
          {switcher}
        </div>
      </DemoBlock>

      {/* 2 — Welcome (empty state) → active conversation */}
      <DemoBlock label={t('welcomeWide')} className="block p-0 sm:p-0">
        <ChatDemoFrame variant="wide" />
        <p className="type-caption text-fg-muted border-border border-t px-4 py-2.5">{t('welcomeNote')}</p>
      </DemoBlock>
      <DemoBlock label={t('welcomePhone')} className="justify-center bg-background">
        <ChatDemoFrame variant="phone" />
        <p className="type-body-sm text-fg-secondary max-w-72 font-normal">{t('mobileNote')}</p>
      </DemoBlock>

      {/* 3 — Conversation, long answer, listen control, error */}
      <DemoBlock label={t('conversation')} className="block p-0 sm:p-0">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
          <AssistantHeader id={character} actions={switcher} className="min-w-0 flex-1" />
          <div className="flex items-center gap-2">
            <Switch id="ds-error" checked={showError} onCheckedChange={setShowError} />
            <Label htmlFor="ds-error">{t('showError')}</Label>
          </div>
        </div>
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
          <SampleConversation id={character} showError={showError} />
          <Composer characterName={name} onSend={() => undefined} />
        </div>
      </DemoBlock>

      {/* 4 — Voice */}
      <VoiceDemos />

      {/* 5 — Beside the map (container-responsive) */}
      <DemoBlock label={t('besideMap')} className="block p-0 sm:p-0">
        <div className="@container">
          <MapPreviewCanvas className="h-[36rem]">
            <OrderLine points={MARKERS.map((m) => [m.x, m.y])} />
            {MARKERS.map((m) => (
              <div key={m.n} className="absolute -translate-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: `${m.x}%`, top: `${m.y}%` }}>
                <MapMarker
                  number={m.n}
                  status={m.n === 1 ? 'completed' : m.n === 2 ? 'current' : 'upcoming'}
                  selected={selectedStop === m.n}
                  label={t('stopLabel', { n: m.n, name: t(`stops.s${m.n}`) })}
                  onClick={() => setSelectedStop(m.n)}
                />
              </div>
            ))}

            {chatCollapsed ? (
              <Button variant="secondary" className="absolute start-4 top-4 shadow-lg" onClick={() => setChatCollapsed(false)}>
                <PanelLeftOpen className="flip-rtl" aria-hidden />
                {t('showChat')}
              </Button>
            ) : (
              <section
                aria-label={t('chatPanel', { name })}
                className={cn(
                  'border-border bg-surface-elevated absolute flex flex-col overflow-hidden border shadow-lg',
                  'inset-x-0 bottom-0 h-[60%] rounded-t-xl',
                  '@3xl:inset-x-auto @3xl:start-4 @3xl:top-4 @3xl:bottom-4 @3xl:h-auto @3xl:w-[42%] @3xl:max-w-[30rem] @3xl:min-w-[22rem] @3xl:rounded-xl',
                )}
              >
                <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
                  <AssistantHeader id={character} className="min-w-0 flex-1" />
                  <IconButton size="icon-sm" label={t('hideChat')} icon={<PanelLeftClose className="flip-rtl" aria-hidden />} onClick={() => setChatCollapsed(true)} />
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
                  <MessageBubble
                    role="assistant"
                    author={name}
                    accent={character}
                    time={time(BASE_TIME)}
                    avatar={<CharacterAvatar id={character} size="sm" decorative />}
                    footer={<SpeakButton messageId={`map-${character}`} text={t('mapAnswer')} character={character} characterName={name} />}
                  >
                    <p>{t('mapAnswer')}</p>
                  </MessageBubble>
                  <ol className="flex flex-col gap-2">
                    {MARKERS.map((m) => (
                      <li key={m.n}>
                        <button
                          type="button"
                          onClick={() => setSelectedStop(m.n)}
                          aria-pressed={selectedStop === m.n}
                          className={cn(
                            'focus-ring border-border flex w-full cursor-pointer items-center gap-3 rounded-md border p-2.5 text-start transition-colors',
                            selectedStop === m.n ? 'bg-selection border-primary/40' : 'hover:bg-surface-muted',
                          )}
                        >
                          <span className="bg-primary-tint text-primary grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold">{m.n}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{t(`stops.s${m.n}`)}</span>
                            <span className="type-caption text-fg-muted">{t(`stops.t${m.n}`)}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="border-border border-t p-3">
                  <Composer characterName={name} onSend={() => undefined} hideDisclaimer />
                </div>
              </section>
            )}
          </MapPreviewCanvas>
        </div>
        <p className="type-caption text-fg-muted border-border border-t px-4 py-2.5">{t('besideMapNote')}</p>
      </DemoBlock>
    </GallerySection>
  );
}
