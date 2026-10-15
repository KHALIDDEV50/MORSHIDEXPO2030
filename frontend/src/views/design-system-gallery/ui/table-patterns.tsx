'use client';

import { Ellipsis, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Badge, Button, DataTable, IconButton, Label, Switch, type DataColumn } from '@/shared/ui';
import { DemoBlock, GallerySection } from './section';

type PlanRow = {
  id: 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
  type: 'tourism' | 'expo';
  status: 'upcoming' | 'inProgress' | 'completed' | 'draft';
  date: string;
  stops: number;
  minutes: number;
};

const ROWS: PlanRow[] = [
  { id: 'p1', type: 'tourism', status: 'inProgress', date: '2026-10-17', stops: 5, minutes: 330 },
  { id: 'p2', type: 'expo', status: 'upcoming', date: '2030-10-04', stops: 4, minutes: 180 },
  { id: 'p3', type: 'tourism', status: 'draft', date: '2026-10-24', stops: 3, minutes: 150 },
  { id: 'p4', type: 'tourism', status: 'completed', date: '2026-09-27', stops: 6, minutes: 420 },
  { id: 'p5', type: 'tourism', status: 'upcoming', date: '2026-11-07', stops: 2, minutes: 90 },
];

const TONE = { upcoming: 'primary', inProgress: 'warning', completed: 'success', draft: 'outline' } as const;

export function TablePatterns() {
  const t = useTranslations('designSystem.tables');
  const ts = useTranslations('designSystem.tabs.plans');
  const [selected, setSelected] = useState<string | null>('p1');
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const columns = useMemo<DataColumn<PlanRow>[]>(
    () => [
      { key: 'name', header: t('col.name'), cell: (r) => t(`rows.${r.id}`), primary: true, truncate: true, titleOf: (r) => t(`rows.${r.id}`), width: '16rem' },
      { key: 'type', header: t('col.type'), cell: (r) => <Badge tone={r.type === 'expo' ? 'roaya' : 'arif'}>{t(`type.${r.type}`)}</Badge> },
      { key: 'date', header: t('col.date'), cell: (r) => <span dir="ltr" className="tabular-nums">{r.date}</span> },
      { key: 'stops', header: t('col.stops'), align: 'end', numeric: true, cell: (r) => r.stops },
      { key: 'duration', header: t('col.duration'), align: 'end', numeric: true, cell: (r) => t('hours', { h: Math.floor(r.minutes / 60), m: r.minutes % 60 }) },
      {
        key: 'status',
        header: t('col.status'),
        cell: (r) => <Badge tone={TONE[r.status]}>{ts(r.status === 'draft' ? 'drafts' : r.status)}</Badge>,
      },
      {
        key: 'actions',
        header: <span className="sr-only">{t('col.actions')}</span>,
        align: 'end',
        hideWhenStacked: true,
        cell: (r) => <IconButton size="icon-sm" label={t('rowActions', { name: t(`rows.${r.id}`) })} icon={<Ellipsis aria-hidden />} onClick={(e) => e.stopPropagation()} />,
      },
    ],
    [t, ts],
  );

  const table = (
    <DataTable
      columns={columns}
      rows={empty ? [] : ROWS}
      getRowId={(r) => r.id}
      caption={t('caption')}
      showCaption
      selectedId={selected}
      onRowSelect={(r) => setSelected(r.id)}
      loading={loading}
      emptyTitle={t('emptyTitle')}
      emptyDescription={t('emptyDescription')}
      emptyAction={
        <Button size="sm" variant="gradient">
          <Plus aria-hidden />
          {t('emptyAction')}
        </Button>
      }
    />
  );

  return (
    <GallerySection id="tables" title={t('title')} description={t('description')}>
      <DemoBlock label={t('controls')} className="gap-6">
        <div className="flex items-center gap-2">
          <Switch id="tbl-loading" checked={loading} onCheckedChange={setLoading} />
          <Label htmlFor="tbl-loading">{t('loading')}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="tbl-empty" checked={empty} onCheckedChange={setEmpty} />
          <Label htmlFor="tbl-empty">{t('empty')}</Label>
        </div>
        <p className="type-caption text-fg-muted">{t('keyboardNote')}</p>
      </DemoBlock>
      <DemoBlock label={t('wide')} className="block">
        {table}
      </DemoBlock>
      <DemoBlock label={t('narrow')} className="justify-center">
        <div className="w-full max-w-[24.375rem]">{table}</div>
      </DemoBlock>
      <p className="type-body-sm text-fg-secondary font-normal">{t('whenToUse')}</p>
    </GallerySection>
  );
}
