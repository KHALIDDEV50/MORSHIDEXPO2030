import { HowItWorksPageView } from '@/views/how-it-works-page';
import { publicMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => publicMetadata(params, 'howItWorks', '/how-it-works');

export default async function HowItWorksPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <HowItWorksPageView />;
}
