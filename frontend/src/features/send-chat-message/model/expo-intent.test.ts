import { describe, expect, it } from 'vitest';
import { DEMO_BOOTHS, DEMO_ZONES } from '@/entities/expo/api/demo/expo';
import { expoReply } from '../api/mock-assistant';
import { expoInterests, matchExpoIntent } from './expo-intent';

const data = { booths: DEMO_BOOTHS, zones: DEMO_ZONES };

describe('Expo assistant intents (demo, illustrative layout only)', () => {
  it('names a pavilion in Arabic or English', () => {
    expect(matchExpoIntent('Tell me about the Main Stage', data)).toEqual({ kind: 'booth', boothId: 'booth_main_stage' });
    expect(matchExpoIntent('أخبرني عن المسرح الرئيسي', data)).toEqual({ kind: 'booth', boothId: 'booth_main_stage' });
  });

  it('plans: interests and named pavilions are carried into the plan request', () => {
    const intent = matchExpoIntent('Plan my Expo visit including Main Stage', data);
    expect(intent).toMatchObject({ kind: 'plan', boothIds: ['booth_main_stage'] });
    expect(matchExpoIntent('خطط زيارتي لإكسبو', data)).toMatchObject({ kind: 'plan' });
  });

  it('maps interests to pavilion categories without false matches inside other words', () => {
    expect(expoInterests("I'm interested in AI and technology")).toContain('ai-tech');
    expect(expoInterests('ماذا يوجد عن الاستدامة؟')).toContain('sustainability');
    // "معرض" (exhibition) must not read as "عرض" (show), "جدول" not as "دول"
    expect(expoInterests('معرض جدول')).toEqual([]);
  });

  it('falls back to an overview that asks about interests', () => {
    expect(matchExpoIntent('hello', data)).toEqual({ kind: 'overview' });
    const reply = expoReply({ kind: 'overview' }, 'en', DEMO_BOOTHS, DEMO_ZONES);
    expect(reply.text).toMatch(/What interests you most/);
    expect(reply.proposal).toBe(false);
  });

  it('builds an Expo-only proposal from interests (booths only, ordered by number)', () => {
    const reply = expoReply({ kind: 'plan', categories: ['sustainability'], boothIds: [] }, 'en', DEMO_BOOTHS, DEMO_ZONES);
    const block = reply.blocks.find((b) => b.type === 'itinerary-proposal');
    expect(block?.type === 'itinerary-proposal' && block.proposal.type).toBe('expo');
    const stops = block?.type === 'itinerary-proposal' ? block.proposal.stops : [];
    expect(stops.length).toBeGreaterThanOrEqual(3);
    expect(stops.every((s) => s.ref.kind === 'booth')).toBe(true);
    expect(reply.blocks.some((b) => b.type === 'notice')).toBe(true);
  });
});
