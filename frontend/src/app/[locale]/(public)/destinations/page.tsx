import { DestinationsPageView } from '@/views/destinations-page';
import { publicMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => publicMetadata(params, 'destinations', '/destinations');

export default async function DestinationsPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <DestinationsPageView />;
}
