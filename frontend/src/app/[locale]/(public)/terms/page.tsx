import { LegalPageView } from '@/views/legal-page';
import { publicMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => publicMetadata(params, 'terms', '/terms');

/** Terms of use — DRAFT pending legal review (docs/public-site.md §6). */
export default async function TermsPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <LegalPageView doc="terms" />;
}
