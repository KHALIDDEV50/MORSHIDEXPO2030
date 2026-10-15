import { LegalPageView } from '@/views/legal-page';
import { publicMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => publicMetadata(params, 'privacy', '/privacy');

/** Privacy policy — DRAFT pending legal review (docs/public-site.md §6). */
export default async function PrivacyPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <LegalPageView doc="privacy" />;
}
