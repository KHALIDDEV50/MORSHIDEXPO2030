'use client';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { ProposalStopContent } from '@/entities/plan';
import { Button, toast } from '@/shared/ui';
import { ProposalSheet, type ProposalMeta } from '@/widgets/proposal-sheet';
import { DemoBlock, GallerySection } from './section';

type StopKey = 'start' | 'masmak' | 'murabba' | 'lunch' | 'museum' | 'souq' | 'bujairi';

const DEFS: { key: StopKey; kind: ProposalStopContent['kind']; duration: number; priority?: ProposalStopContent['priority']; x: number; y: number }[] = [
  { key: 'start', kind: 'start', duration: 0, x: 10, y: 22 },
  { key: 'masmak', kind: 'visit', duration: 60, priority: 'high', x: 24, y: 52 },
  { key: 'murabba', kind: 'visit', duration: 45, priority: 'recommended', x: 38, y: 30 },
  { key: 'lunch', kind: 'break', duration: 60, x: 50, y: 62 },
  { key: 'museum', kind: 'visit', duration: 90, priority: 'high', x: 62, y: 34 },
  { key: 'souq', kind: 'visit', duration: 40, priority: 'optional', x: 76, y: 60 },
  { key: 'bujairi', kind: 'destination', duration: 0, x: 88, y: 30 },
];

export function ProposalPatterns() {
  const t = useTranslations('designSystem.proposal');
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  const stops = useMemo<ProposalStopContent[]>(
    () =>
      DEFS.map((d) => ({
        id: d.key,
        kind: d.kind,
        durationMin: d.duration,
        priority: d.priority,
        position: { x: d.x, y: d.y },
        name: t(`stops.${d.key}.name`),
        area: t(`stops.${d.key}.area`),
        summary: t(`stops.${d.key}.summary`),
        context: t(`stops.${d.key}.context`),
        tips: [t(`stops.${d.key}.tip`)],
      })),
    [t],
  );

  const meta: ProposalMeta = {
    // A new id per "fresh proposal" so the demo save can be repeated
    id: `heritage-${session}`,
    title: t('title'),
    description: t('description'),
    tripType: 'tourism',
    scheduleHint: t('scheduleHint'),
    startTime: '08:30',
    bufferMin: 15,
  };

  return (
    <GallerySection id="proposal" title={t('sectionTitle')} description={t('sectionDescription')}>
      <DemoBlock label={t('launch')} className="flex-col items-start gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="gradient" onClick={() => setOpen(true)}>
            <Sparkles aria-hidden />
            {t('open')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSession((s) => s + 1);
              toast(t('resetToast'));
            }}
          >
            {t('reset')}
          </Button>
        </div>
        <ul className="type-body-sm text-fg-secondary list-disc space-y-1 ps-5 font-normal">
          {(['n1', 'n2', 'n3', 'n4', 'n5'] as const).map((k) => (
            <li key={k}>{t(`notes.${k}`)}</li>
          ))}
        </ul>
      </DemoBlock>
      <ProposalSheet
        key={session}
        open={open}
        onOpenChange={setOpen}
        meta={meta}
        stops={stops}
        mapLabel={t('mapLabel')}
        onAskAbout={() => toast(t('askToast'))}
      />
    </GallerySection>
  );
}
