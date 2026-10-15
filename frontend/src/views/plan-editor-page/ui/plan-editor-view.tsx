'use client';

import { ArrowLeft, Route } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { usePlan, type PlanStopRef } from '@/entities/plan';
import { isApiError } from '@/shared/api';
import { Link } from '@/shared/i18n';
import { Button, EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import { PlanEditor } from '@/widgets/plan-editor';

/** Create (/plans/new?type=expo&add=booth_…) or edit (/plans/[id]/edit) a plan (PRD §4.4, Screen 12). */
export function PlanEditorView({ planId }: { planId?: string }) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-96 rounded-xl" />}>
      <EditorPage planId={planId} />
    </Suspense>
  );
}

function EditorPage({ planId }: { planId?: string }) {
  const t = useTranslations('planEditor');
  const search = useSearchParams();
  const query = usePlan(planId ?? null);

  const add = search.get('add');
  const initialStop: PlanStopRef | undefined = add?.startsWith('plc_') ? { kind: 'place', placeId: add } : add?.startsWith('booth_') ? { kind: 'booth', boothId: add } : undefined;
  const typeParam = search.get('type');
  const initialType = typeParam === 'expo' || typeParam === 'tourism' ? typeParam : undefined;

  return (
    <div className="bg-page flex-1">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <Link href={planId ? `/plans/${planId}` : '/plans'} className="focus-ring text-fg-secondary hover:text-fg inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium">
          <ArrowLeft className="flip-rtl size-4" aria-hidden />
          {planId ? t('backToPlan') : t('backToPlans')}
        </Link>
        <header className="flex flex-col gap-1.5">
          <h1 className="type-h1">{planId ? t('editTitle') : t('newTitle')}</h1>
          <p className="type-body text-fg-secondary">{planId ? t('editSubtitle') : t('newSubtitle')}</p>
        </header>
        {!planId ? (
          <PlanEditor initialType={initialType} initialStop={initialStop} />
        ) : query.isPending ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : query.isError ? (
          isApiError(query.error) && query.error.code === 'NOT_FOUND' ? (
            <EmptyState
              icon={<Route />}
              title={t('notFound')}
              action={
                <Button asChild variant="secondary">
                  <Link href="/plans">{t('backToPlans')}</Link>
                </Button>
              }
            />
          ) : (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          )
        ) : (
          // Keyed by plan + updatedAt so the form starts from the saved values
          <PlanEditor key={`${query.data.id}:${query.data.updatedAt}`} plan={query.data} />
        )}
      </div>
    </div>
  );
}
