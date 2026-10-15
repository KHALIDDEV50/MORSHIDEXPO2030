import { normalizeSearch } from '@/entities/place';

/**
 * DEMO intent matcher for the mock assistant (docs/demo-data.md §3). Keyword stems in Arabic and
 * English, matched on normalized text (diacritics removed, alef / taa marbuta / yaa folded).
 * This is not AI: anything unmatched gets the honest fallback.
 */
export type ScenarioId =
  | 'S1_heritage_sites'
  | 'S2_modern_riyadh'
  | 'S3_family_day'
  | 'S4_food'
  | 'S5_beyond_riyadh'
  | 'S6_expo_ai_booths'
  | 'S7_expo_itinerary'
  | 'S8_heritage_itinerary'
  | 'S9_place_followup'
  | 'fallback';

export type FollowUp = 'history' | 'focus' | 'nearby' | 'overview';

export type Intent = { scenario: Exclude<ScenarioId, 'S9_place_followup'> } | { scenario: 'S9_place_followup'; placeId: string; followUp: FollowUp };

/** Normalized for matching: also treats hyphens as spaces ("Al-Zal" = "Al Zal"). */
const norm = (text: string) => normalizeSearch(text).replace(/[-‐‑]/g, ' ').replace(/\s+/g, ' ');
const n = (words: string[]) => words.map(norm);

const KEYWORDS = {
  itinerary: n(['itinerary', 'plan', 'schedule', 'one day', 'one-day', 'half day', 'half-day', 'route', 'خطه', 'خطط', 'جدول', 'مسار', 'برنامج', 'يوم واحد', 'نصف يوم']),
  expo: n(['expo', 'booth', 'pavilion', 'exhibition', 'اكسبو', 'جناح', 'اجنحه', 'معرض', 'معارض']),
  aiTech: n(['ai', 'artificial', 'tech', 'technology', 'innovation', 'robot', 'ذكاء', 'اصطناعي', 'تقنيه', 'تقنيات', 'ابتكار']),
  heritage: n(['history', 'historic', 'heritage', 'old riyadh', 'ancient', 'تاريخ', 'تاريخي', 'تراث', 'اثري', 'اثريه', 'قديم', 'القديمه']),
  family: n(['family', 'kids', 'children', 'child', 'عائل', 'اطفال', 'الاطفال', 'اولاد']),
  food: n(['food', 'eat', 'cafe', 'café', 'coffee', 'restaurant', 'dinner', 'lunch', 'najdi', 'اكل', 'الاكل', 'طعام', 'مطعم', 'مطاعم', 'مقهى', 'مقاهي', 'قهوه', 'نجدي', 'عشاء', 'غداء']),
  beyond: n(['beyond riyadh', 'outside riyadh', 'alula', 'al ula', 'hegra', 'jeddah', 'abha', 'saudi highlights', 'خارج الرياض', 'العلا', 'الحجر', 'جده', 'ابها', 'المملكه']),
  modern: n(['modern', 'architecture', 'skyline', 'tower', 'contemporary', 'حديث', 'الحديثه', 'عماره', 'العماره', 'معماري', 'برج', 'ابراج']),
  history: n(['history', 'story', 'built', 'when', 'why famous', 'تاريخ', 'قصه', 'بني', 'متى', 'لماذا اشتهر']),
  focus: n(['what to see', 'focus', 'tips', 'look for', 'look out', 'should i see', 'highlight', 'ماذا اشاهد', 'ماذا ارى', 'بماذا', 'نصائح', 'انتبه', 'اهم ما']),
  nearby: n(['nearby', 'near', 'around', 'close to', 'next to', 'قريب', 'قريبه', 'بالقرب', 'حول', 'بجانب']),
};

function has(text: string, words: string[]): boolean {
  return words.some((w) => {
    // Short Latin words ("ai", "eat") must match as whole words; Arabic stems match inside words
    if (/^[a-z]{1,3}$/.test(w)) return new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(text);
    return text.includes(w);
  });
}

/** Shared with the Expo matcher: normalize once, then test keyword lists (normalized here). */
export const normalizeMessage = norm;
export const hasAny = (normalizedText: string, words: string[]) => has(normalizedText, n(words));
export const isItineraryRequest = (normalizedText: string) => has(normalizedText, KEYWORDS.itinerary);

export type PlaceName = { id: string; names: string[] };

/**
 * Decide the scenario for a message. `contextPlaceId` is the conversation's place context (docked
 * chat on place details); `places` lets a message name a place directly ("tell me about Masmak").
 */
export function matchIntent(message: string, { contextPlaceId, places = [] }: { contextPlaceId?: string; places?: PlaceName[] } = {}): Intent {
  const text = norm(message);
  const followUp = (): FollowUp => (has(text, KEYWORDS.nearby) ? 'nearby' : has(text, KEYWORDS.history) ? 'history' : has(text, KEYWORDS.focus) ? 'focus' : 'overview');

  const expo = has(text, KEYWORDS.expo);
  const itinerary = has(text, KEYWORDS.itinerary);

  // Itineraries first (they also contain topic words)
  if (expo && itinerary) return { scenario: 'S7_expo_itinerary' };
  if (expo || (has(text, KEYWORDS.aiTech) && !has(text, KEYWORDS.heritage))) return { scenario: 'S6_expo_ai_booths' };

  // A question about one specific place (context or named) → place follow-up
  const named = places.find((p) => p.names.some((name) => name.length >= 3 && text.includes(norm(name))));
  if (contextPlaceId && !has(text, [...KEYWORDS.itinerary, ...KEYWORDS.family, ...KEYWORDS.food, ...KEYWORDS.beyond, ...KEYWORDS.modern]) && !named) {
    return { scenario: 'S9_place_followup', placeId: contextPlaceId, followUp: followUp() };
  }
  if (named && !itinerary) return { scenario: 'S9_place_followup', placeId: named.id, followUp: followUp() };

  if (has(text, KEYWORDS.heritage) && itinerary) return { scenario: 'S8_heritage_itinerary' };
  if (has(text, KEYWORDS.family)) return { scenario: 'S3_family_day' };
  if (has(text, KEYWORDS.food)) return { scenario: 'S4_food' };
  if (has(text, KEYWORDS.beyond)) return { scenario: 'S5_beyond_riyadh' };
  if (has(text, KEYWORDS.modern)) return { scenario: 'S2_modern_riyadh' };
  if (has(text, KEYWORDS.heritage)) return { scenario: 'S1_heritage_sites' };
  if (itinerary) return { scenario: 'S8_heritage_itinerary' };
  return { scenario: 'fallback' };
}
