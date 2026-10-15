import { z } from 'zod';

/** Signed-in account profile (api-contracts.md `User`). */
export const UserProfileSchema = z.object({
  id: z.string(),
  /** Names are proper nouns written per script; resolved by locale with an English fallback */
  name: z.object({ ar: z.string().min(1), en: z.string().min(1) }),
  /** Read-only in the demo (PRD §4.5) */
  email: z.string().email(),
  /** Local or approved image URL; null → initials avatar */
  avatarUrl: z.string().nullable(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export function displayName(user: Pick<UserProfile, 'name'>, locale: string): string {
  return locale === 'ar' ? user.name.ar : user.name.en;
}

/** First letter(s) for the initials avatar (Arabic: first letter; Latin: up to two initials). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (/[؀-ۿ]/.test(name)) return parts[0]!.charAt(0);
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}
