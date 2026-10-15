import ar from '@messages/ar.json';
import en from '@messages/en.json';
import { describe, expect, it } from 'vitest';
import { DEMO_PLACES } from '@/entities/place/api/demo/places';
import { placeNames } from '../api/mock-assistant';
import { matchIntent } from './intent';

const places = placeNames(DEMO_PLACES);
const match = (text: string, contextPlaceId?: string) => matchIntent(text, { places, contextPlaceId });

describe('intent matcher — the welcome suggestion prompts (both languages)', () => {
  const expected = {
    arif: { s1: 'S1_heritage_sites', s2: 'S8_heritage_itinerary', s3: 'S4_food', s4: 'S5_beyond_riyadh' },
    roaya: { s1: 'S6_expo_ai_booths', s2: 'S7_expo_itinerary', s3: 'S3_family_day', s4: 'S2_modern_riyadh' },
  } as const;
  for (const [lang, dict] of [
    ['en', en],
    ['ar', ar],
  ] as const) {
    for (const character of ['arif', 'roaya'] as const) {
      for (const key of ['s1', 's2', 's3', 's4'] as const) {
        const prompt = dict.characters[character].suggestions[key].prompt;
        it(`${lang} ${character} ${key}: “${prompt}”`, () => {
          expect(match(prompt).scenario).toBe(expected[character][key]);
        });
      }
    }
  }
});

describe('intent matcher — place follow-ups (S9)', () => {
  it('answers the docked-chat suggestions about the context place', () => {
    for (const dict of [en, ar]) {
      const s = dict.placeChat.suggestions;
      const name = dict === en ? 'Masmak Fortress' : 'قصر المصمك';
      expect(match(s.history.replace('{name}', name), 'plc_masmak')).toEqual({ scenario: 'S9_place_followup', placeId: 'plc_masmak', followUp: 'history' });
      expect(match(s.focus.replace('{name}', name), 'plc_masmak')).toEqual({ scenario: 'S9_place_followup', placeId: 'plc_masmak', followUp: 'focus' });
      expect(match(s.nearby.replace('{name}', name), 'plc_masmak')).toEqual({ scenario: 'S9_place_followup', placeId: 'plc_masmak', followUp: 'nearby' });
    }
  });

  it('recognises a place named in the message, even by a short name', () => {
    expect(match('Tell me more about Masmak')).toMatchObject({ scenario: 'S9_place_followup', placeId: 'plc_masmak' });
    expect(match('what is near at-turaif?')).toMatchObject({ scenario: 'S9_place_followup', placeId: 'plc_turaif', followUp: 'nearby' });
    expect(match('أخبرني عن الطريف')).toMatchObject({ scenario: 'S9_place_followup', placeId: 'plc_turaif' });
  });

  it('uses the place context for short questions, but not for other topics', () => {
    expect(match('Is it good for kids?', 'plc_masmak').scenario).toBe('S3_family_day');
    expect(match('What is the story here?', 'plc_masmak')).toMatchObject({ scenario: 'S9_place_followup', placeId: 'plc_masmak', followUp: 'history' });
  });
});

describe('intent matcher — itineraries and fallback', () => {
  it('prefers itineraries when a topic and a plan word appear together', () => {
    expect(match('Plan a half day at Expo').scenario).toBe('S7_expo_itinerary');
    expect(match('one-day heritage itinerary please').scenario).toBe('S8_heritage_itinerary');
    expect(match('خطة ليوم واحد في الرياض القديمة').scenario).toBe('S8_heritage_itinerary');
  });

  it('gives the honest fallback for unsupported requests', () => {
    expect(match('What is the weather tomorrow?').scenario).toBe('fallback');
    expect(match('كم سعر تذكرة الطيران؟').scenario).toBe('fallback');
  });

  it('matches short English words only as whole words', () => {
    expect(match('I said hello again').scenario).toBe('fallback'); // "ai" inside "said"/"again" must not match
  });
});
