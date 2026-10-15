/**
 * AI character registry (PRD §4.1). Names, greetings and prompts live in messages under
 * `characters.<id>.*`; visual identity lives here so it is never scattered across components.
 */
export const CHARACTER_IDS = ['arif', 'roaya'] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

export type CharacterVisual = {
  id: CharacterId;
  /** Full-body transparent cutout */
  fullImage: string;
  /**
   * Head-and-shoulders crop of the full image: `objectY` positions the image in the circle,
   * then it is zoomed by `scale` around (`x`, `originY`).
   */
  avatarFocus: { x: string; objectY: string; originY: string; scale: number };
  /** Static Tailwind classes for the character accent (design-system.md §2) */
  accent: {
    text: string;
    bg: string;
    tint: string;
    border: string;
    ring: string;
  };
};

export const CHARACTERS: Record<CharacterId, CharacterVisual> = {
  arif: {
    id: 'arif',
    fullImage: '/images/characters/arif-full.png',
    avatarFocus: { x: '48%', objectY: '17%', originY: '17%', scale: 1.9 },
    accent: {
      text: 'text-arif-fg',
      bg: 'bg-arif',
      tint: 'bg-arif-tint',
      border: 'border-arif/45',
      ring: 'ring-arif',
    },
  },
  roaya: {
    id: 'roaya',
    fullImage: '/images/characters/roaya-full.png',
    avatarFocus: { x: '49%', objectY: '5%', originY: '10%', scale: 1.9 },
    accent: {
      text: 'text-roaya-fg',
      bg: 'bg-roaya',
      tint: 'bg-roaya-tint',
      border: 'border-roaya/45',
      ring: 'ring-roaya',
    },
  },
};

/** Welcome-screen suggestions per character; text lives in messages `characters.<id>.suggestions.<key>`. */
export type SuggestionIcon = 'landmark' | 'route' | 'food' | 'compass' | 'cpu' | 'ticket' | 'family' | 'building';
export const SUGGESTIONS: Record<CharacterId, { key: 's1' | 's2' | 's3' | 's4'; icon: SuggestionIcon }[]> = {
  arif: [
    { key: 's1', icon: 'landmark' },
    { key: 's2', icon: 'route' },
    { key: 's3', icon: 'food' },
    { key: 's4', icon: 'compass' },
  ],
  roaya: [
    { key: 's1', icon: 'cpu' },
    { key: 's2', icon: 'ticket' },
    { key: 's3', icon: 'family' },
    { key: 's4', icon: 'building' },
  ],
};

export function otherCharacter(id: CharacterId): CharacterId {
  return id === 'arif' ? 'roaya' : 'arif';
}
