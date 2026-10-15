import { articleRepository } from '@/entities/article';
import { JournalPageView } from '@/views/journal-page';
import { publicMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => publicMetadata(params, 'journal', '/blog');

/** Travel Journal: sample articles from the CMS-ready article repository; filters use `?category=`. */
export default async function JournalPage({ params }: LocaleParams) {
  await resolveLocale(params);
  const articles = await articleRepository.list();
  return <JournalPageView articles={articles} />;
}
