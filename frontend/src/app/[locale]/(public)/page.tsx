import { articleRepository } from '@/entities/article';
import { LandingPageView } from '@/views/landing-page';
import { publicMetadata, resolveLocale, type LocaleParams } from './route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => publicMetadata(params, 'home', '');

/** Home: the MORSHID brand experience, leading into the real product (Chat stays at /chat). */
export default async function HomePage({ params }: LocaleParams) {
  await resolveLocale(params);
  const articles = await articleRepository.list();
  return <LandingPageView articles={articles.filter((a) => a.featured)} />;
}
