import { PlaceDetailsView } from '@/views/place-details-page';
import { navMetadata, resolveLocale } from '../../route-helpers';

type Props = { params: Promise<{ locale: string; placeId: string }> };

export const generateMetadata = ({ params }: Props) => navMetadata(params, 'discover');

/** Place details. Data loads on the client through the place repository (demo or HTTP). */
export default async function PlaceDetailsPage({ params }: Props) {
  await resolveLocale(params);
  const { placeId } = await params;
  return <PlaceDetailsView placeId={decodeURIComponent(placeId)} />;
}
