import { PlanEditorView } from '@/views/plan-editor-page';
import { navMetadata, resolveLocale, type LocaleParams } from '../../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => navMetadata(params, 'plans');

export default async function NewPlanPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <PlanEditorView />;
}
