'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { CharacterAvatar, useActiveCharacter } from '@/entities/ai-character';
import { conversationKeys, conversationRepository } from '@/entities/conversation';
import type { Place } from '@/entities/place';
import { localize } from '@/shared/api';
import { useRouter } from '@/shared/i18n';
import { Button, toast } from '@/shared/ui';

/**
 * "Ask {character} about this place" (D-022, PRD §4.2): starts a real conversation with the
 * place attached as context (saved to history), then opens it in Chat.
 */
export function AskAboutPlaceButton({
  place,
  variant = 'secondary',
  onAsk,
  className,
}: {
  place: Place;
  variant?: 'primary' | 'secondary';
  /** Place details: open the docked contextual chat instead of going to Chat */
  onAsk?: () => void;
  className?: string;
}) {
  const t = useTranslations('askAboutPlace');
  const tc = useTranslations('characters');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [character] = useActiveCharacter();
  const characterName = tc(`${character}.name`);
  const placeName = localize(place.name, locale);

  const start = useMutation({
    mutationFn: () =>
      conversationRepository.create({
        characterId: character,
        locale,
        title: t('conversationTitle', { name: placeName }),
        context: { kind: 'place', placeId: place.id },
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
      {t('button', { name: characterName })}
    </Button>
  );
}
