import { PlanEditorView } from '@/views/plan-editor-page';
import { navMetadata, resolveLocale } from '../../../route-helpers';

type Props = { params: Promise<{ locale: string; planId: string }> };

export const generateMetadata = ({ params }: Props) => navMetadata(params, 'plans');

export default async function EditPlanPage({ params }: Props) {
  await resolveLocale(params);
  const { planId } = await params;
  return <PlanEditorView planId={decodeURIComponent(planId)} />;
}
