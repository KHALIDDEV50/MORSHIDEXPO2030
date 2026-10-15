import { SettingsPageView } from '@/views/settings-page';
import { navMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => navMetadata(params, 'profile');

export default async function SettingsPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <SettingsPageView />;
}
