import { PlansPageView } from '@/views/settings-page';
import { navMetadata, resolveLocale, type LocaleParams } from '../../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => navMetadata(params, 'profile');

export default async function SettingsPlansPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <PlansPageView />;
}
