'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { CharacterId } from '@/entities/ai-character';
import {
  SpeechServicesProvider,
  createSimulatedSpeechInput,
  createSimulatedSpeechOutput,
  type SpeechInputProvider,
  type SpeechOutputProvider,
} from '@/shared/lib/speech';
import { AudioLines } from 'lucide-react';
import { Button, DemoBadge, SegmentedControl } from '@/shared/ui';
import { VoiceCompanion, VoiceStage, type VoicePhase, type VoiceStageProps } from '@/widgets/voice-companion';
import { DemoBlock, GallerySection } from './section';

type ServiceMode = 'live' | 'simulated' | 'denied' | 'unsupported';

const LEVELS = Array.from({ length: 28 }, (_, i) => 0.2 + 0.6 * Math.abs(Math.sin(i / 2.4)));

const STATES: { key: 'starting' | 'listening' | 'review' | 'thinking' | 'speaking' | 'paused' | 'denied' | 'unsupported'; phase: VoicePhase; character: CharacterId }[] = [
  { key: 'starting', phase: 'starting', character: 'arif' },
  { key: 'listening', phase: 'listening', character: 'arif' },
  { key: 'review', phase: 'review', character: 'roaya' },
  { key: 'thinking', phase: 'thinking', character: 'roaya' },
  { key: 'speaking', phase: 'speaking', character: 'arif' },
  { key: 'paused', phase: 'paused', character: 'roaya' },
  { key: 'denied', phase: 'error', character: 'arif' },
  { key: 'unsupported', phase: 'error', character: 'roaya' },
];

export function VoiceModePatterns() {
  const t = useTranslations('designSystem.voiceMode');
  const tm = useTranslations('voiceMode');
  const tc = useTranslations('characters');
  const [mode, setMode] = useState<ServiceMode>('simulated');
  const [open, setOpen] = useState(false);
  const [character, setCharacter] = useState<CharacterId>('arif');

  const services = useMemo<{ input?: SpeechInputProvider; output?: SpeechOutputProvider }>(() => {
    const transcript = t('sampleHeard');
    if (mode === 'simulated') return { input: createSimulatedSpeechInput('success', transcript), output: createSimulatedSpeechOutput('success', { msPerChar: 55 }) };
    if (mode === 'denied') return { input: createSimulatedSpeechInput('permission-denied', transcript) };
    if (mode === 'unsupported') return { input: createSimulatedSpeechInput('unsupported', transcript), output: createSimulatedSpeechOutput('unsupported') };
    return {};
  }, [mode, t]);

  const sampleReply = tm(`demoReplies.arif.r1`);

  const tileProps = (s: (typeof STATES)[number]): VoiceStageProps => ({
    character: s.character,
    phase: s.phase,
    preview: true,
    error:
      s.key === 'denied'
        ? { source: 'input', code: 'permission-denied' }
        : s.key === 'unsupported'
          ? { source: 'input', code: 'unsupported' }
          : null,
    levels: s.phase === 'listening' ? LEVELS : null,
    interim: s.phase === 'listening' ? t('sampleInterim') : '',
    turns:
      s.phase === 'speaking' || s.phase === 'paused'
        ? [
            { id: 'u', role: 'user', text: t('sampleHeard') },
            { id: 'a', role: 'assistant', text: s.character === 'arif' ? sampleReply : tm('demoReplies.roaya.r1') },
          ]
        : [],
    draft: s.phase === 'review' ? t('sampleHeard') : '',
    muted: false,
    canReplay: false,
    showTranscript: false,
  });

  return (
    <GallerySection id="voiceMode" title={t('title')} description={t('description')}>
      <DemoBlock label={t('launch')} className="flex-col items-stretch gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold">{t('services')}</span>
          <SegmentedControl
            label={t('services')}
            value={mode}
            onValueChange={setMode}
            options={(['live', 'simulated', 'denied', 'unsupported'] as const).map((m) => ({ value: m, label: t(`serviceModes.${m}`) }))}
          />
          {mode !== 'live' && <DemoBadge label={t('serviceModes.simulated')} />}
        </div>
        <p className="type-body-sm text-fg-secondary font-normal">{t('servicesNote')}</p>
        <div className="flex flex-wrap gap-3">
          {(['arif', 'roaya'] as const).map((id) => (
            <Button
              key={id}
              variant={id === 'arif' ? 'gradient' : 'secondary'}
              onClick={() => {
                setCharacter(id);
                setOpen(true);
              }}
            >
              <AudioLines aria-hidden />
              {t('openWith', { name: tc(`${id}.name`) })}
            </Button>
          ))}
        </div>
        <SpeechServicesProvider key={mode} input={services.input} output={services.output}>
          <VoiceCompanion open={open} onOpenChange={setOpen} character={character} onCharacterChange={setCharacter} />
        </SpeechServicesProvider>
      </DemoBlock>

      <DemoBlock label={t('states')} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATES.map((s) => (
          <figure key={s.key} className="flex flex-col gap-2">
            {/* Static preview: hidden from assistive tech (the caption names the state) and not focusable */}
            <div className="border-border h-[34rem] overflow-hidden rounded-2xl border" inert aria-hidden="true">
              <VoiceStage {...tileProps(s)} />
            </div>
            <figcaption className="type-caption text-fg-secondary text-center">{t(`stateLabels.${s.key}`)}</figcaption>
          </figure>
        ))}
      </DemoBlock>

      <DemoBlock label={t('limitations')} className="block">
        <ul className="type-body text-fg-secondary grid list-disc gap-x-8 gap-y-1.5 ps-5 md:grid-cols-2">
          {(['l1', 'l2', 'l3', 'l4', 'l5'] as const).map((k) => (
            <li key={k}>{t(`limitationNotes.${k}`)}</li>
          ))}
        </ul>
      </DemoBlock>
    </GallerySection>
  );
}
