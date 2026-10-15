'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { CharacterAvatar, useActiveCharacter } from '@/entities/ai-character';
import { conversationKeys, conversationRepository } from '@/entities/conversation';
import type { ExpoBooth } from '@/entities/expo';
import { localize } from '@/shared/api';
import { useRouter } from '@/shared/i18n';
import { Button, toast } from '@/shared/ui';

/**
 * "Ask {character} about this pavilion": a conversation with the booth as context — in the
 * pavilion page's chat popup (`onAsk`), otherwise opened in Chat.
 */
export function AskAboutBoothButton({
  booth,
  variant = 'secondary',
  onAsk,
  className,
}: {
  booth: ExpoBooth;
  variant?: 'primary' | 'secondary';
  /** Pavilion page: open the chat popup instead of going to Chat */
  onAsk?: () => void;
  className?: string;
}) {
  const t = useTranslations('askAboutPlace');
  const tc = useTranslations('characters');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [character] = useActiveCharacter();

  const start = useMutation({
    mutationFn: () =>
      conversationRepository.create({
        characterId: character,
        locale,
        title: t('conversationTitle', { name: `${booth.number} · ${localize(booth.name, locale)}` }),
        context: { kind: 'booth', boothId: booth.id },
      }),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      router.push(`/chat?c=${encodeURIComponent(conversation.id)}`);
    },
    onError: () => toast.error(t('errorToast')),
  });

  return (
    <Button variant={variant} onClick={() => (onAsk ? onAsk() : start.mutate())} disabled={start.isPending} className={className}>
      <CharacterAvatar id={character} size="xs" ring={false} decorative />
      {t('buttonBooth', { name: tc(`${character}.name`) })}
    </Button>
  );
}
