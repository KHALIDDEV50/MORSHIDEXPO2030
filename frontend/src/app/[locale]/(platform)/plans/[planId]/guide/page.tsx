import { GuidedView } from '@/views/guided-page';
import { navMetadata, resolveLocale } from '../../../route-helpers';

type Props = { params: Promise<{ locale: string; planId: string }> };

export const generateMetadata = ({ params }: Props) => navMetadata(params, 'plans');

/** Guided Start Plan mode (D-017–D-019). The phone bottom nav is hidden on this route (D-015). */
export default async function GuidePage({ params }: Props) {
  await resolveLocale(params);
  const { planId } = await params;
  return <GuidedView planId={decodeURIComponent(planId)} />;
}
