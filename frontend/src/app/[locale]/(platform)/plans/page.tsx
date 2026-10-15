import { PlansPageView } from '@/views/plans-page';
import { navMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => navMetadata(params, 'plans');

export default async function PlansPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <PlansPageView />;
}
