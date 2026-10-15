import { BoothDetailsView } from '@/views/booth-details-page';
import { navMetadata, resolveLocale } from '../../route-helpers';

type Props = { params: Promise<{ locale: string; boothId: string }> };

export const generateMetadata = ({ params }: Props) => navMetadata(params, 'expo');

/** Expo pavilion details (illustrative demo data). */
export default async function BoothPage({ params }: Props) {
  await resolveLocale(params);
  const { boothId } = await params;
  return <BoothDetailsView boothId={decodeURIComponent(boothId)} />;
}
