import { PlanDetailsView } from '@/views/plan-details-page';
import { navMetadata, resolveLocale } from '../../route-helpers';

type Props = { params: Promise<{ locale: string; planId: string }> };

export const generateMetadata = ({ params }: Props) => navMetadata(params, 'plans');

export default async function PlanPage({ params }: Props) {
  await resolveLocale(params);
  const { planId } = await params;
  return <PlanDetailsView planId={decodeURIComponent(planId)} />;
}
