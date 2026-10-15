import { MobileAppPageView } from '@/views/mobile-app-page';
import { publicMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => publicMetadata(params, 'mobileApp', '/mobile-app');

export default async function MobileAppPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <MobileAppPageView />;
}
