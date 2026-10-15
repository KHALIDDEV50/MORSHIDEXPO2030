import { DiscoverPageView } from '@/views/discover-page';
import { navMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => navMetadata(params, 'discover');

export default async function DiscoverPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <DiscoverPageView />;
}
