'use client';

import type { ReactNode } from 'react';
import { setActiveCharacter, type CharacterId } from '@/entities/ai-character';
import { Link } from '@/shared/i18n';

/**
 * Opens Chat with a chosen companion: the active character is stored (the same preference the
 * chat's switcher uses) before navigating, so "Chat with Roaya" really starts with Roaya.
 */
export function GuideChatLink({ character, className, children }: { character: CharacterId; className?: string; children: ReactNode }) {
  return (
    <Link href="/chat" className={className} onClick={() => setActiveCharacter(character)}>
      {children}
    </Link>
  );
}
