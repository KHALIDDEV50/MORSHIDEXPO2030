import { conversationRepository, type ItineraryProposal, type MessageBlock, type StopRef } from '@/entities/conversation';
import { expoRepository, type ExpoBooth, type ExpoBoothCategory, type ExpoZone } from '@/entities/expo';
import { placeRepository, type Place } from '@/entities/place';
import { creditsRepository } from '@/entities/subscription';
import { ApiError, demoId, isApiError, maybeFail, simulateLatency, type LocalizedText } from '@/shared/api';
import { matchExpoIntent, type ExpoIntent } from '../model/expo-intent';
import { matchIntent, type Intent, type PlaceName } from '../model/intent';
import { DEMO_NOTICE, FALLBACK, FOLLOW_UP_COPY, OUT_OF_CREDITS_NOTICE, SCENARIOS, type RecommendationSeed } from './demo/scenarios';
import type { AssistantEvent, AssistantGateway, ReplyInput } from './assistant';

type Lang = 'ar' | 'en';
type Character = ReplyInput['conversation']['characterId'];

/** Words that don't identify a place on their own ("Palace", "Museum" …) — not used as aliases. */
const GENERIC = new Set(
  [
    'fortress', 'palace', 'museum', 'park', 'centre', 'center', 'district', 'terrace', 'national', 'saudi', 'arabia', 'kingdom', 'king', 'abdullah',
    'financial', 'bridge', 'historic', 'world', 'edge', 'souq', 'the', 'of', 'al',
    'قصر', 'متحف', 'المتحف', 'الوطني', 'السعودي', 'حديقه', 'حي', 'مركز', 'برج', 'المملكه', 'الملك', 'عبدالله', 'المالي', 'جسر', 'السماء', 'منتزه', 'مطلات', 'حافه', 'العالم', 'سوق', 'التاريخيه', 'البلد',
  ].map((w) => w.normalize('NFKD')),
);

/** Full names plus distinctive words ("Masmak", "الطريف") so short questions find the place. */
export function placeNames(places: Place[]): PlaceName[] {
  return places.map((p) => {
    const words = [p.name.ar, p.name.en]
      .join(' ')
      .replace(/[()—–-]/g, ' ')
      .split(/\s+/)
      .map((w) => w.toLowerCase().replace(/ة/g, 'ه'))
      .filter((w) => w.length >= 4 && !GENERIC.has(w.normalize('NFKD')));
    return { id: p.id, names: [p.name.ar, p.name.en, ...words] };
  });
}

const ref = (id: string): StopRef => (id.startsWith('booth_') ? { kind: 'booth', boothId: id } : { kind: 'place', placeId: id });

const fill = (text: string, name: string) => text.replace('{name}', name);

/** Great-circle distance in km (for "nearby" ordering only — never shown as distance-from-user). */
function km(a: Place['location'], b: Place['location']): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const NEARBY_KM = 4;

export type BuiltReply = { text: string; blocks: MessageBlock[]; proposal: boolean };

/** Pure reply builder (unit-tested): scenario → markdown-lite text + structured blocks. */
export function buildReply(intent: Intent, character: Character, lang: Lang, places: Place[], booths: ExpoBooth[]): BuiltReply {
  const L = (text: LocalizedText) => text[lang] ?? text.en;
  const exists = (id: string) => (id.startsWith('booth_') ? booths.some((b) => b.id === id) : places.some((p) => p.id === id));
  const notice: MessageBlock = { type: 'notice', kind: 'demo', text: DEMO_NOTICE };
  const recommendations = (seeds: RecommendationSeed[]): MessageBlock[] => {
    const items = seeds.filter((s) => exists(s.ref)).map((s) => ({ ref: ref(s.ref), priority: s.priority, reason: s.reason }));
    return items.length ? [{ type: 'recommendations', items }] : [];
  };

  if (intent.scenario === 'fallback') {
    return { text: `${L(FALLBACK.intro[character])}\n\n${L(FALLBACK.body)}`, blocks: [notice], proposal: false };
  }

  if (intent.scenario === 'S9_place_followup') {
    const place = places.find((p) => p.id === intent.placeId);
    if (!place) return buildReply({ scenario: 'fallback' }, character, lang, places, booths);
    const name = L(place.name);
    const bullets = (items: LocalizedText[]) => items.map((i) => `- ${L(i)}`).join('\n');
    switch (intent.followUp) {
      case 'history':
        return { text: `${fill(L(FOLLOW_UP_COPY.history), name)}\n\n${L(place.history ?? place.description)}`, blocks: [notice], proposal: false };
      case 'focus':
        return { text: `${fill(L(FOLLOW_UP_COPY.focus), name)}\n\n${bullets(place.tips)}`, blocks: [notice], proposal: false };
      case 'nearby': {
        // Real coordinates only (D-023): the closest guide places within a few kilometres
        const near = places
          .filter((p) => p.id !== place.id)
          .map((p) => ({ p, d: km(place.location, p.location) }))
          .filter(({ d }) => d <= NEARBY_KM)
          .sort((a, b) => a.d - b.d)
          .slice(0, 4);
        if (!near.length) return { text: fill(L(FOLLOW_UP_COPY.nearbyNone), name), blocks: [notice], proposal: false };
        return {
          text: fill(L(FOLLOW_UP_COPY.nearby), name),
          blocks: [
            { type: 'recommendations', items: near.map(({ p }, i) => ({ ref: ref(p.id), priority: i === 0 ? 'high' : 'recommended', reason: { ar: fill(FOLLOW_UP_COPY.nearbyReason.ar, place.name.ar), en: fill(FOLLOW_UP_COPY.nearbyReason.en, place.name.en) } })) },
            notice,
          ],
          proposal: false,
        };
      }
      default:
        return {
          text: `${fill(L(FOLLOW_UP_COPY.overview), name)}\n\n${L(place.summary)} ${L(place.description)}\n\n${bullets(place.tips)}`,
          blocks: [notice],
          proposal: false,
        };
    }
  }

  const copy = SCENARIOS[intent.scenario];
  const text = `${L(copy.intro[character])}\n\n${L(copy.body)}`;
  const blocks: MessageBlock[] = [];
  if (copy.recommendations) blocks.push(...recommendations(copy.recommendations));
  if (copy.proposal) {
    const p = copy.proposal;
    const proposal: ItineraryProposal = {
      id: demoId('prop'),
      title: p.title,
      type: p.type,
      startTime: p.startTime,
      bufferMin: p.bufferMin,
      rationale: p.rationale,
      stops: p.stops
        .filter((s) => exists(s.ref))
        .map((s, order) => ({
          ref: ref(s.ref),
          order,
          durationMin:
            s.durationMin ??
            (s.ref.startsWith('booth_') ? booths.find((b) => b.id === s.ref)?.suggestedDurationMin : places.find((pl) => pl.id === s.ref)?.suggestedDurationMin) ??
            60,
          priority: s.priority,
          reason: s.reason,
          kept: true,
        })),
    };
    blocks.push({ type: 'itinerary-proposal', proposal });
  }
  blocks.push(notice);
  return { text, blocks, proposal: Boolean(copy.proposal) };
}

/** Overview of one Expo pavilion (fictional demo data, labelled as such). */
export function boothReply(booth: ExpoBooth, lang: Lang): BuiltReply {
  const L = (text: LocalizedText) => text[lang] ?? text.en;
  const activities = booth.activities.map((a) => `- ${L(a.title)}${a.time ? ` — ${a.time} (${lang === 'ar' ? 'وقت تجريبي' : 'demo time'})` : ''}`).join('\n');
  const intro = lang === 'ar' ? `**${booth.number} · ${L(booth.name)}** — ${L(booth.summary)}` : `**${booth.number} · ${L(booth.name)}** — ${L(booth.summary)}`;
  const note = lang === 'ar' ? 'هذا الجناح من المخطط التجريبي التوضيحي، وليس من البرنامج الرسمي لإكسبو.' : 'This pavilion is from the illustrative demo layout, not the official Expo programme.';
  return { text: `${intro}\n\n${activities}\n\n${note}`, blocks: [{ type: 'notice', kind: 'demo', text: DEMO_NOTICE }], proposal: false };
}

const tx = (ar: string, en: string): LocalizedText => ({ ar, en });

/** Pavilion categories as the assistant names them (demo copy). */
const EXPO_CATEGORY: Record<ExpoBoothCategory, LocalizedText> = {
  'ai-tech': tx('الذكاء الاصطناعي والتقنية', 'AI & technology'),
  culture: tx('الثقافة والفنون', 'culture & the arts'),
  sustainability: tx('الاستدامة', 'sustainability'),
  mobility: tx('تنقّل المستقبل', 'future mobility'),
  health: tx('الصحة', 'health'),
  countries: tx('أجنحة الدول (توضيحية)', 'national pavilions (illustrative)'),
  events: tx('العروض والفعاليات العائلية', 'shows & family events'),
};

const EXPO_COPY = {
  layoutNote: tx('كل ما سبق من المخطط التجريبي التوضيحي، وليس من البرنامج الرسمي لإكسبو 2030.', 'All of this comes from the illustrative demo layout, not the official Expo 2030 programme.'),
  overview: tx(
    'أستطيع مساعدتك في استكشاف المخطط التوضيحي لإكسبو 2030 ({count} مناطق): {zones}.\n\nما الذي يهمك أكثر — التقنية، أم الثقافة، أم الاستدامة، أم التنقل، أم الصحة، أم العروض؟ ويمكنني أيضًا إعداد مسودة خطة زيارة تراجعها ثم تحفظها في خططي.',
    'I can help you explore the illustrative Expo 2030 layout ({count} zones): {zones}.\n\nWhat interests you most — technology, culture, sustainability, mobility, health or shows? I can also draft a visit plan for you to review and save to My Plans.',
  ),
  interests: tx('هذه الأجنحة تناسب اهتمامك بـ{topics}. هل تريد أن أحوّلها إلى خطة زيارة؟', 'These pavilions match your interest in {topics}. Shall I turn them into a visit plan?'),
  zone: tx('المنطقة {number} · **{name}** — {summary}\n\nأبرز ما فيها:', 'Zone {number} · **{name}** — {summary}\n\nHighlights:'),
  zoneEmpty: tx('المنطقة {number} · **{name}** — {summary}', 'Zone {number} · **{name}** — {summary}'),
  plan: tx(
    'هذه مسودة خطة زيارة بحسب ما طلبت. راجع المحطات، ثم احفظها في خططي إن أعجبتك — لا يُحفظ شيء قبل ذلك.',
    "Here's a draft visit plan based on what you asked. Review the stops, then save it to My Plans if it suits you — nothing is saved before that.",
  ),
  planTitle: tx('زيارتك لإكسبو حسب اهتماماتك', 'Your Expo visit, by your interests'),
  planRationale: tx(
    'اخترت أجنحة من المخطط التوضيحي تطابق طلبك، ورتبتها حسب أرقامها لتقليل التنقل. الأوقات تقديرية.',
    'I picked pavilions from the illustrative layout that match your request and ordered them by number to keep walking short. Times are estimates.',
  ),
  askedByName: tx('طلبته بالاسم.', 'You asked for it by name.'),
};

const fillAll = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), text);

/** Location-number order ("3.10" after "3.2"). */
const byNumber = (a: ExpoBooth, b: ExpoBooth) => a.number.localeCompare(b.number, 'en', { numeric: true });

/**
 * Expo assistant replies (Expo page and pavilion pages), built from the illustrative demo layout
 * only: one pavilion, one zone, pavilions by interest, a reviewable visit plan, or an overview.
 */
export function expoReply(intent: ExpoIntent, lang: Lang, booths: ExpoBooth[], zones: ExpoZone[], contextBooth?: ExpoBooth, character: Character = 'roaya'): BuiltReply {
  const L = (text: LocalizedText) => text[lang] ?? text.en;
  const notice: MessageBlock = { type: 'notice', kind: 'demo', text: DEMO_NOTICE };
  const recs = (list: ExpoBooth[]): MessageBlock => ({
    type: 'recommendations',
    items: list.map((b, i) => ({ ref: ref(b.id), priority: i === 0 ? 'high' : i < 3 ? 'recommended' : 'optional', reason: b.summary })),
  });

  switch (intent.kind) {
    case 'booth': {
      const booth = booths.find((b) => b.id === intent.boothId);
      return booth ? boothReply(booth, lang) : expoReply({ kind: 'overview' }, lang, booths, zones, contextBooth);
    }
    case 'zone': {
      const zone = zones.find((z) => z.id === intent.zoneId);
      if (!zone) return expoReply({ kind: 'overview' }, lang, booths, zones, contextBooth);
      const inZone = booths.filter((b) => b.zoneId === zone.id).sort(byNumber).slice(0, 5);
      const values = { number: zone.number, name: L(zone.name), summary: L(zone.summary) };
      return {
        text: `${fillAll(L(inZone.length ? EXPO_COPY.zone : EXPO_COPY.zoneEmpty), values)}\n\n${L(EXPO_COPY.layoutNote)}`,
        blocks: inZone.length ? [recs(inZone), notice] : [notice],
        proposal: false,
      };
    }
    case 'interests': {
      const matches = booths.filter((b) => intent.categories.includes(b.category)).sort(byNumber).slice(0, 5);
      const topics = intent.categories.map((c) => L(EXPO_CATEGORY[c])).join(lang === 'ar' ? ' و' : ' & ');
      return { text: `${fillAll(L(EXPO_COPY.interests), { topics })}\n\n${L(EXPO_COPY.layoutNote)}`, blocks: matches.length ? [recs(matches), notice] : [notice], proposal: false };
    }
    case 'plan': {
      const named = intent.boothIds.map((id) => booths.find((b) => b.id === id)).filter((b): b is ExpoBooth => Boolean(b));
      const pool = intent.categories.length ? booths.filter((b) => intent.categories.includes(b.category)) : [];
      // Nothing specific asked: the standard demo Expo half-day (S7)
      if (!named.length && !pool.length) return buildReply({ scenario: 'S7_expo_itinerary' }, character, lang, [], booths);
      const picked = [...named, ...pool.filter((b) => !named.includes(b)).sort(byNumber)].slice(0, 5);
      // Top up a very short plan with the pavilion being viewed, then by location number
      for (const b of [contextBooth, ...[...booths].sort(byNumber)]) {
        if (picked.length >= 3) break;
        if (b && !picked.includes(b)) picked.push(b);
      }
      const ordered = [...picked].sort(byNumber);
      const proposal: ItineraryProposal = {
        id: demoId('prop'),
        title: EXPO_COPY.planTitle,
        type: 'expo',
        startTime: '10:00',
        bufferMin: 10,
        rationale: EXPO_COPY.planRationale,
        stops: ordered.map((b, order) => ({
          ref: ref(b.id),
          order,
          durationMin: b.suggestedDurationMin,
          priority: named.includes(b) || order < 2 ? 'high' : order < 4 ? 'recommended' : 'optional',
          reason: named.includes(b) ? EXPO_COPY.askedByName : b.summary,
          kept: true,
        })),
      };
      return { text: L(EXPO_COPY.plan), blocks: [{ type: 'itinerary-proposal', proposal }, notice], proposal: true };
    }
    default: {
      if (contextBooth) return boothReply(contextBooth, lang);
      const names = [...zones].sort((a, b) => a.number - b.number).map((z) => L(z.name)).join(lang === 'ar' ? '، ' : ', ');
      return { text: fillAll(L(EXPO_COPY.overview), { count: zones.length, zones: names }), blocks: [notice], proposal: false };
    }
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ApiError('ABORTED'));
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(id);
        reject(new ApiError('ABORTED'));
      },
      { once: true },
    );
  });
}

/** DEMO gateway: canned scenarios streamed word by word; debits 1 demo credit per reply. */
export const mockAssistant: AssistantGateway = {
  async *reply({ conversation, text }, signal): AsyncGenerator<AssistantEvent> {
    const lang: Lang = conversation.locale === 'ar' ? 'ar' : 'en';
    await simulateLatency(signal, [500, 1000]); // "thinking"
    maybeFail('assistant'); // ?demoError=assistant → error + Retry

    const [placePage, booths] = await Promise.all([placeRepository.search({ locale: lang, pageSize: 100 }, signal), expoRepository.searchBooths({}, signal)]);
    const places = placePage.items;
    const intent = matchIntent(text, {
      contextPlaceId: conversation.context?.kind === 'place' ? conversation.context.placeId : undefined,
      places: placeNames(places),
    });
    // The Expo assistant and pavilion chats answer from the illustrative Expo layout; a clear
    // tourism question (food, heritage, a named place …) still gets the tourism answer.
    const context = conversation.context;
    let reply: BuiltReply;
    if (context?.kind === 'expo' || context?.kind === 'booth') {
      const contextBooth = context.kind === 'booth' ? booths.find((b) => b.id === context.boothId) : undefined;
      const { zones } = await expoRepository.getLayout(signal);
      const expoIntent = matchExpoIntent(text, { booths, zones });
      const tourism = expoIntent.kind === 'overview' && !['fallback', 'S6_expo_ai_booths', 'S7_expo_itinerary'].includes(intent.scenario);
      reply = tourism ? buildReply(intent, conversation.characterId, lang, places, booths) : expoReply(expoIntent, lang, booths, zones, contextBooth, conversation.characterId);
    } else {
      reply = buildReply(intent, conversation.characterId, lang, places, booths);
    }

    // Credits (P-012): 1 per reply. The real server debits as part of the message request.
    let blocks: MessageBlock[];
    let replyText: string | null = reply.text;
    try {
      await creditsRepository.consume(reply.proposal ? 'itinerary_proposal' : 'ai_reply');
      blocks = reply.blocks;
    } catch (error) {
      if (!(isApiError(error) && error.code === 'OUT_OF_CREDITS')) throw error;
      replyText = null;
      blocks = [{ type: 'notice', kind: 'out_of_credits', text: OUT_OF_CREDITS_NOTICE }];
    }

    if (replyText) {
      yield { type: 'block-start', block: { type: 'text', text: '' } };
      for (const token of replyText.split(/(\s+)/)) {
        if (!token) continue;
        await sleep(/\s/.test(token) ? 0 : 22, signal);
        yield { type: 'text-delta', delta: token };
      }
    }
    for (const block of blocks) yield { type: 'block-start', block };

    const message = await conversationRepository.appendMessage({
      conversationId: conversation.id,
      role: 'assistant',
      blocks: replyText ? [{ type: 'text', text: replyText }, ...blocks] : blocks,
      status: 'done',
    });
    yield { type: 'done', message };
  },
};

/** The gateway in use. An HTTP/SSE gateway will be selected by NEXT_PUBLIC_DATA_SOURCE later. */
export const assistantGateway: AssistantGateway = mockAssistant;
