import type { ExpoBooth, ExpoBoothCategory, ExpoZone } from '@/entities/expo';
import { hasAny, isItineraryRequest, normalizeMessage } from './intent';

/**
 * DEMO intent matcher for the Expo assistant (Expo page, pavilion pages). Keyword stems in
 * Arabic and English, like the tourism matcher. It only knows the illustrative demo layout —
 * never official pavilions, positions or programme times. Not AI.
 */
export type ExpoIntent =
  | { kind: 'plan'; categories: ExpoBoothCategory[]; boothIds: string[] }
  | { kind: 'booth'; boothId: string }
  | { kind: 'zone'; zoneId: string }
  | { kind: 'interests'; categories: ExpoBoothCategory[] }
  | { kind: 'overview' };

/**
 * Interest words per pavilion category. Arabic stems match inside words, so stems that are part
 * of other words are avoided ("عرض" is inside "معرض", "دول" inside "جدول", "طب" inside "طبيعة").
 */
const INTERESTS: Record<ExpoBoothCategory, string[]> = {
  'ai-tech': ['ai', 'artificial', 'tech', 'technology', 'innovation', 'robot', 'digital', 'ذكاء', 'اصطناعي', 'تقنيه', 'تقنيات', 'التقنيه', 'ابتكار', 'روبوت', 'رقمي'],
  culture: ['culture', 'cultural', 'heritage', 'art', 'arts', 'music', 'film', 'cinema', 'calligraphy', 'crafts', 'ثقافه', 'ثقافي', 'تراث', 'فنون', 'موسيقي', 'سينما', 'افلام', 'الخط العربي', 'الحرف'],
  sustainability: ['sustainab', 'green', 'environment', 'energy', 'climate', 'solar', 'استدامه', 'بيئه', 'البيئه', 'طاقه', 'مناخ', 'اخضر'],
  mobility: ['mobility', 'transport', 'vehicle', 'cars', 'flying', 'تنقل', 'النقل', 'سيارات', 'مواصلات', 'طائرات'],
  health: ['health', 'medicine', 'medical', 'wellbeing', 'صحه', 'صحي', 'علاج', 'دواء'],
  countries: ['countries', 'nations', 'international', 'الدول', 'الامم', 'دوليه'],
  events: ['show', 'shows', 'stage', 'concert', 'event', 'events', 'performance', 'family', 'kids', 'children', 'عروض', 'العرض', 'المسرح', 'مسرح', 'حفل', 'فعالي', 'عائل', 'اطفال'],
};

/** Full names without the "(illustrative)" note — "Main Stage", "المسرح الرئيسي" … */
const namesOf = (text: { ar: string; en: string }) => [text.ar, text.en].map((s) => normalizeMessage(s.replace(/\(.*?\)/g, ''))).filter((s) => s.length >= 4);

export function expoInterests(message: string): ExpoBoothCategory[] {
  const text = normalizeMessage(message);
  return (Object.keys(INTERESTS) as ExpoBoothCategory[]).filter((c) => hasAny(text, INTERESTS[c]));
}

/** Decide the Expo answer: a visit plan, one pavilion, one zone, pavilions by interest, or an overview. */
export function matchExpoIntent(message: string, { booths, zones }: { booths: ExpoBooth[]; zones: ExpoZone[] }): ExpoIntent {
  const text = normalizeMessage(message);
  const named = booths.filter((b) => namesOf(b.name).some((name) => text.includes(name)));
  const categories = expoInterests(message);

  if (isItineraryRequest(text)) return { kind: 'plan', categories, boothIds: named.map((b) => b.id) };
  if (named[0]) return { kind: 'booth', boothId: named[0].id };
  const zone = zones.find((z) => namesOf(z.name).some((name) => text.includes(name)));
  if (zone) return { kind: 'zone', zoneId: zone.id };
  if (categories.length) return { kind: 'interests', categories };
  return { kind: 'overview' };
}
