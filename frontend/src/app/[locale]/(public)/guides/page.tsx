import { GuidesPageView } from '@/views/guides-page';
import { publicMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => publicMetadata(params, 'guides', '/guides');

export default async function GuidesPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <GuidesPageView />;
}
