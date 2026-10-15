import { describe, expect, it } from 'vitest';
import { seedConversations } from '@/entities/conversation/api/demo/conversations';
import { DEMO_BOOTHS } from '@/entities/expo/api/demo/expo';
import { seedNotifications } from '@/entities/notification/api/demo/notifications';
import { DEMO_PLACES } from '@/entities/place/api/demo/places';
import { DEMO_FEATURED_PLANS, seedPlans } from '@/entities/plan/api/demo/plans';
import { SAMPLE_ARTICLES } from '@/entities/article/api/content/articles';
import { SITE_MEDIA } from '@/shared/content';

/**
 * Cross-domain checks for the demo dataset (lives in the app layer because it reads several
 * entities): every place/booth a plan, proposal or notification points to must exist.
 */
const placeIds = new Set(DEMO_PLACES.map((p) => p.id));
const boothIds = new Set(DEMO_BOOTHS.map((b) => b.id));
const refExists = (ref: { kind: 'place'; placeId: string } | { kind: 'booth'; boothId: string }) =>
  ref.kind === 'place' ? placeIds.has(ref.placeId) : boothIds.has(ref.boothId);

describe('demo data integrity', () => {
  it('plan stops reference existing places and booths, matching the plan type', () => {
    for (const plan of [...seedPlans(), ...DEMO_FEATURED_PLANS]) {
      for (const stop of plan.stops) {
        expect(refExists(stop.ref), `${plan.id} → ${JSON.stringify(stop.ref)}`).toBe(true);
        expect(stop.ref.kind, plan.id).toBe(plan.type === 'expo' ? 'booth' : 'place');
      }
    }
  });

  it('plan start / end points reference existing places and booths', () => {
    for (const plan of seedPlans()) {
      for (const endpoint of [plan.start, plan.end]) {
        if (endpoint?.kind === 'place') expect(placeIds.has(endpoint.placeId), plan.id).toBe(true);
        if (endpoint?.kind === 'booth') expect(boothIds.has(endpoint.boothId), plan.id).toBe(true);
      }
    }
  });

  it('recommendations and proposals reference existing places and booths', () => {
    for (const message of seedConversations().messages) {
      for (const block of message.blocks) {
        if (block.type === 'recommendations') for (const item of block.items) expect(refExists(item.ref), message.id).toBe(true);
        if (block.type === 'itinerary-proposal') for (const stop of block.proposal.stops) expect(refExists(stop.ref), message.id).toBe(true);
      }
    }
  });

  it('the saved proposal points to the plan created from it (D-021)', () => {
    const plans = seedPlans();
    const saved = seedConversations()
      .messages.flatMap((m) => m.blocks)
      .flatMap((b) => (b.type === 'itinerary-proposal' && b.proposal.savedPlanId ? [b.proposal] : []));
    for (const proposal of saved) {
      expect(plans.find((p) => p.id === proposal.savedPlanId)?.sourceProposalId).toBe(proposal.id);
    }
  });

  it('notification links point to existing plans or places', () => {
    const planIds = new Set(seedPlans().map((p) => p.id));
    for (const n of seedNotifications().items) {
      if (!n.link) continue;
      const [, section, id] = n.link.split('/');
      if (section === 'plans') expect(planIds.has(id!), n.id).toBe(true);
      if (section === 'discover') expect(placeIds.has(id!), n.id).toBe(true);
    }
  });

  it('journal articles point to existing places and site photos', () => {
    for (const article of SAMPLE_ARTICLES) {
      expect(article.cover in SITE_MEDIA, article.slug).toBe(true);
      for (const id of article.relatedPlaceIds) expect(placeIds.has(id), `${article.slug} → ${id}`).toBe(true);
      for (const block of article.body) {
        if (block.type === 'places') for (const id of block.placeIds) expect(placeIds.has(id), `${article.slug} → ${id}`).toBe(true);
      }
    }
  });

  it('site photos reuse the catalogue photos with the same credits', () => {
    const catalogue = new Map(DEMO_PLACES.flatMap((p) => p.images).filter((i) => !i.placeholder).map((i) => [i.src, i]));
    for (const [key, media] of Object.entries(SITE_MEDIA)) {
      const image = catalogue.get(media.src);
      if (!image) continue; // Expo theme photos live in the Expo data
      expect(media.credit, key).toBe(image.credit);
      expect(media.sourceUrl, key).toBe(image.sourceUrl);
    }
  });
});
