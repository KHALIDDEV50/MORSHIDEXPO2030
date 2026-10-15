import { ExpoPageView } from '@/views/expo-page';
import { navMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => navMetadata(params, 'expo');

export default async function ExpoPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <ExpoPageView />;
}
