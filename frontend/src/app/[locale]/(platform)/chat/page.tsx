import { ChatPageView } from '@/views/chat-page';
import { navMetadata, resolveLocale, type LocaleParams } from '../route-helpers';

export const generateMetadata = ({ params }: LocaleParams) => navMetadata(params, 'chat');

export default async function ChatPage({ params }: LocaleParams) {
  await resolveLocale(params);
  return <ChatPageView />;
}
