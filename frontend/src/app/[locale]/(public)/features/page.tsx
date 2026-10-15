import { FeaturesPageView } from '@/views/features-page';
import { publicMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => publicMetadata(params, 'features', '/features');

export default async function FeaturesPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <FeaturesPageView />;
}
