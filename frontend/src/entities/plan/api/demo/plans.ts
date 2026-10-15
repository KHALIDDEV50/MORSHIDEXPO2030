import type { FeaturedPlan, Plan, PlanBreak, PlanStop } from '../../model/plan';

/**
 * DEMO plans (docs/demo-data.md §2): one per status plus two Expo plans, and three copyable
 * featured plans. Stops reference demo place/booth ids. Dates are relative to "today" so the
 * statuses stay meaningful whenever the demo is opened.
 */
const tx = (ar: string, en: string) => ({ ar, en });
const OWNER = 'usr_demo';

function isoDay(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const at = (dayOffset: number, time: string) => new Date(`${isoDay(dayOffset)}T${time}:00`).toISOString();

/**
 * "Live" demo clock for the two in-progress plans (P-028): times relative to when the demo is
 * opened, so they always show stops done, one stop running late (متأخرة) and a lunch break coming
 * up. The base is "now" rounded down to 5 minutes, kept between 04:00 and 19:30 so the day never
 * wraps past midnight (before 04:00 nothing is late yet).
 */
function liveBase(): number {
  const d = new Date();
  const now = d.getHours() * 60 + d.getMinutes();
  return Math.min(Math.max(now - (now % 5), 4 * 60), 19 * 60 + 30);
}
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
/** "HH:mm" today, `offset` minutes from the live base */
const live = (base: number, offset: number) => hhmm(base + offset);
/** ISO timestamp today, `offset` minutes from the live base */
const liveAt = (base: number, offset: number) => at(0, hhmm(base + offset));

type StopSeed = [ref: string, durationMin: number, startTime?: string, doneAt?: string];
type BaseStop = Omit<PlanStop, 'completedAt'>;

function baseStops(planKey: string, seeds: StopSeed[]): BaseStop[] {
  return seeds.map(([ref, durationMin, startTime], order): BaseStop => ({
    id: `stop_${planKey}_${order + 1}`,
    order,
    ref: ref.startsWith('booth_') ? { kind: 'booth', boothId: ref } : { kind: 'place', placeId: ref },
    durationMin,
    ...(startTime ? { startTime } : {}),
  }));
}

function stops(planKey: string, seeds: StopSeed[]): PlanStop[] {
  return baseStops(planKey, seeds).map((s, i) => ({ ...s, completedAt: seeds[i]?.[3] ?? null }));
}

function lunchBreak(planKey: string, afterStop: number, startTime: string, durationMin: number, label = tx('استراحة غداء', 'Lunch break')): PlanBreak {
  return { id: `brk_${planKey}_lunch`, afterStopId: `stop_${planKey}_${afterStop}`, label, startTime, durationMin, completedAt: null };
}

export function seedPlans(): Plan[] {
  const b = liveBase();
  return [
    {
      id: 'plan_heritage_day',
      ownerId: OWNER,
      name: 'يوم في الرياض القديمة',
      type: 'tourism',
      date: isoDay(0),
      startTime: live(b, -200),
      isDraft: false,
      startedAt: liveAt(b, -205),
      // Saved from the demo conversation's proposal (conversation demo data)
      sourceProposalId: 'prop_heritage_saved',
      // Start at the metro station next to Masmak; end with dinner at Al-Bujairi after At-Turaif
      start: {
        kind: 'point',
        name: tx('محطة مترو قصر الحكم', 'Qasr Al-Hukm Metro Station'),
        location: { lat: 24.6286264, lng: 46.7160924 },
        locationSource: 'osm:way/1385940134 (Nominatim, 2026-10-12)',
      },
      end: { kind: 'place', placeId: 'plc_bujairi' },
      // In progress: 2 of 5 done, Murabba Palace running late, then a lunch break (P-028)
      stops: stops('heritage_day', [
        ['plc_masmak', 60, live(b, -200), liveAt(b, -135)],
        ['plc_souq_zal', 45, live(b, -125), liveAt(b, -75)],
        ['plc_murabba', 45, live(b, -70)],
        ['plc_national_museum', 90, live(b, 45)],
        ['plc_turaif', 120, live(b, 150)],
      ]),
      breaks: [lunchBreak('heritage_day', 3, live(b, -20), 60)],
      createdAt: at(-3, '20:10'),
      updatedAt: liveAt(b, -75),
    },
    {
      id: 'plan_modern_evening',
      ownerId: OWNER,
      name: 'Modern Riyadh evening',
      type: 'tourism',
      date: isoDay(4),
      startTime: '17:00',
      isDraft: false,
      stops: stops('modern_evening', [
        ['plc_kafd', 75, '17:00'],
        ['plc_kingdom_centre', 60, '18:30'],
        ['plc_king_abdullah_park', 90, '20:00'],
      ]),
      createdAt: at(-1, '12:00'),
      updatedAt: at(-1, '12:00'),
    },
    {
      id: 'plan_diriyah_done',
      ownerId: OWNER,
      name: 'الدرعية مع العائلة',
      type: 'tourism',
      date: isoDay(-6),
      startTime: '16:00',
      isDraft: false,
      startedAt: at(-6, '16:05'),
      stops: stops('diriyah_done', [
        ['plc_turaif', 120, '16:00', at(-6, '18:10')],
        ['plc_bujairi', 90, '18:30', at(-6, '20:00')],
      ]),
      createdAt: at(-9, '09:00'),
      updatedAt: at(-6, '20:00'),
    },
    {
      id: 'plan_weekend_draft',
      ownerId: OWNER,
      name: 'Weekend road trip (draft)',
      type: 'tourism',
      isDraft: true,
      stops: stops('weekend_draft', [['plc_edge_world', 300]]),
      createdAt: at(-2, '22:15'),
      updatedAt: at(-2, '22:15'),
    },
    {
      id: 'plan_expo_ai',
      ownerId: OWNER,
      name: 'Expo: AI & Tech half-day',
      type: 'expo',
      date: isoDay(0),
      startTime: live(b, -150),
      isDraft: false,
      startedAt: liveAt(b, -155),
      // In progress today: the first pavilion done, the AI Experience Hall running late, then lunch
      // at the Food Court (5.5, central plaza) before the afternoon pavilions (P-028)
      stops: stops('expo_ai', [
        ['booth_digital_innovation', 45, live(b, -150), liveAt(b, -100)],
        ['booth_ai_experience', 60, live(b, -95)],
        ['booth_future_cities', 40, live(b, 25)],
        ['booth_space_lab', 30, live(b, 75)],
      ]),
      breaks: [lunchBreak('expo_ai', 2, live(b, -30), 45, tx('استراحة غداء في ساحة المطاعم', 'Lunch break at the Food Court'))],
      createdAt: at(-1, '18:30'),
      updatedAt: liveAt(b, -100),
    },
    {
      id: 'plan_expo_culture',
      ownerId: OWNER,
      name: 'إكسبو: يوم الثقافة',
      type: 'expo',
      isDraft: true,
      stops: stops('expo_culture', [
        ['booth_heritage_crafts', 40],
        ['booth_arabic_calligraphy', 45],
        ['booth_music_hall', 60],
      ]),
      createdAt: at(-4, '11:20'),
      updatedAt: at(-4, '11:20'),
    },
  ];
}

function featuredStops(key: string, seeds: [string, number, string][]): FeaturedPlan['stops'] {
  return baseStops(key, seeds);
}

export const DEMO_FEATURED_PLANS: FeaturedPlan[] = [
  {
    id: 'feat_heritage_day',
    name: tx('يوم في تراث الرياض', 'Riyadh heritage day'),
    summary: tx('المصمك وسوق الزل والمتحف الوطني ثم الدرعية مساءً.', 'Masmak, Souq Al-Zal and the National Museum, then Diriyah in the evening.'),
    type: 'tourism',
    startTime: '08:30',
    stops: featuredStops('feat_heritage', [
      ['plc_masmak', 60, '08:30'],
      ['plc_souq_zal', 45, '09:45'],
      ['plc_national_museum', 90, '11:00'],
      ['plc_turaif', 120, '16:00'],
      ['plc_bujairi', 90, '18:15'],
    ]),
  },
  {
    id: 'feat_modern_evening',
    name: tx('أمسية في الرياض الحديثة', 'Modern Riyadh evening'),
    summary: tx('العمارة الحديثة وإطلالة المدينة وحديقة عائلية.', 'Modern architecture, city views and a family park.'),
    type: 'tourism',
    startTime: '17:00',
    stops: featuredStops('feat_modern', [
      ['plc_kafd', 75, '17:00'],
      ['plc_kingdom_centre', 60, '18:30'],
      ['plc_king_abdullah_park', 90, '20:00'],
    ]),
  },
  {
    id: 'feat_expo_ai',
    name: tx('نصف يوم في إكسبو: الذكاء الاصطناعي والتقنية', 'Expo half-day: AI & Tech'),
    summary: tx('أجنحة تجريبية توضيحية عن الذكاء الاصطناعي والتنقل.', 'Illustrative demo pavilions on AI and mobility.'),
    type: 'expo',
    startTime: '10:00',
    stops: featuredStops('feat_expo', [
      ['booth_digital_innovation', 45, '10:00'],
      ['booth_ai_experience', 60, '10:50'],
      ['booth_mobility_hub', 45, '11:55'],
      ['booth_air_taxi', 30, '12:45'],
    ]),
  },
];
