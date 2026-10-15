import type { ChatMessage, Conversation, ItineraryProposal, MessageBlock } from '../../model/conversation';

/**
 * DEMO conversation history (docs/demo-data.md §2): 3 per character, spread over Today /
 * Last 7 days / Older, written in Arabic or English like a real history. Includes one SAVED
 * proposal (→ plan_heritage_day) and one UNSAVED proposal. Assistant text is canned demo copy.
 */
const tx = (ar: string, en: string) => ({ ar, en });

function at(dayOffset: number, time: string): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const [h = 0, m = 0] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const place = (placeId: string) => ({ kind: 'place' as const, placeId });
const booth = (boothId: string) => ({ kind: 'booth' as const, boothId });
const demoNotice: MessageBlock = {
  type: 'notice',
  kind: 'demo',
  text: tx('ردود تجريبية — ليست ذكاءً اصطناعيًا حقيقيًا.', 'Demo replies — not a real AI.'),
};

const SAVED_PROPOSAL: ItineraryProposal = {
  id: 'prop_heritage_saved',
  title: tx('يوم في الرياض القديمة', 'Old Riyadh in one day'),
  type: 'tourism',
  startTime: '08:30',
  bufferMin: 15,
  rationale: tx('بدأت بالمعالم القريبة من بعضها في الديرة ثم الدرعية قبيل الغروب.', 'Starts with the close-together sites in Al-Dirah, then Diriyah before sunset.'),
  stops: [
    { ref: place('plc_masmak'), order: 0, durationMin: 60, priority: 'high', reason: tx('بداية قصة الرياض الحديثة.', 'Where modern Riyadh began.'), kept: true },
    { ref: place('plc_souq_zal'), order: 1, durationMin: 45, priority: 'recommended', reason: tx('سوق تقليدي بجوار المصمك.', 'A traditional souq next to Masmak.'), kept: true },
    { ref: place('plc_murabba'), order: 2, durationMin: 45, priority: 'recommended', reason: tx('قصر الملك عبدالعزيز.', "King Abdulaziz's palace."), kept: true },
    { ref: place('plc_national_museum'), order: 3, durationMin: 90, priority: 'high', reason: tx('أشمل قصة للجزيرة العربية.', "The fullest story of Arabia."), kept: true },
    { ref: place('plc_turaif'), order: 4, durationMin: 120, priority: 'high', reason: tx('موقع تراث عالمي، أجمل قبيل الغروب.', 'UNESCO site, best before sunset.'), kept: true },
  ],
  savedPlanId: 'plan_heritage_day',
};

const UNSAVED_PROPOSAL: ItineraryProposal = {
  id: 'prop_expo_ai_draft',
  title: tx('نصف يوم في إكسبو: الذكاء الاصطناعي', 'Expo half-day: AI & Tech'),
  type: 'expo',
  startTime: '10:00',
  bufferMin: 5,
  rationale: tx('أجنحة متجاورة في منطقة التقنيات (بيانات تجريبية توضيحية).', 'Neighbouring pavilions in the Technology district (illustrative demo data).'),
  stops: [
    { ref: booth('booth_digital_innovation'), order: 0, durationMin: 45, priority: 'high', reason: tx('عرض الروبوتات الساعة 11:00.', 'Robotics show at 11:00.'), kept: true },
    { ref: booth('booth_ai_experience'), order: 1, durationMin: 60, priority: 'high', reason: tx('ورشة للمبتدئين.', 'A beginners workshop.'), kept: true },
    { ref: booth('booth_future_cities'), order: 2, durationMin: 40, priority: 'recommended', reason: tx('نماذج المدن الذكية.', 'Smart-city models.'), kept: true },
    { ref: booth('booth_space_lab'), order: 3, durationMin: 30, priority: 'optional', reason: tx('محاكاة قصيرة وممتعة.', 'A short, fun simulation.'), kept: false },
  ],
};

type Seed = { conversation: Conversation; messages: [role: ChatMessage['role'], blocks: MessageBlock[], time: string][] };

const SEEDS = (): Seed[] => [
  {
    conversation: { id: 'conv_heritage_day', characterId: 'arif', title: 'يوم تراثي في الرياض', locale: 'ar', context: { kind: 'planner' }, createdAt: at(0, '08:00'), updatedAt: at(0, '08:05') },
    messages: [
      ['user', [{ type: 'text', text: 'خطط لي يومًا واحدًا لزيارة أهم المعالم التراثية في الرياض' }], '08:00'],
      ['assistant', [{ type: 'text', text: 'هذا اقتراح ليوم كامل يبدأ الساعة 08:30. الأوقات تقديرية.' }, { type: 'itinerary-proposal', proposal: SAVED_PROPOSAL }, demoNotice], '08:01'],
      ['user', [{ type: 'text', text: 'ممتاز، احفظه في خططي' }], '08:04'],
      ['assistant', [{ type: 'text', text: 'تم الحفظ في «خططي». رحلة سعيدة!' }], '08:05'],
    ],
  },
  {
    conversation: { id: 'conv_masmak_history', characterId: 'arif', title: 'Masmak Fortress history', locale: 'en', context: { kind: 'place', placeId: 'plc_masmak' }, createdAt: at(-3, '15:20'), updatedAt: at(-3, '15:24') },
    messages: [
      ['user', [{ type: 'text', text: 'Why is Masmak Fortress famous?' }], '15:20'],
      ['assistant', [{ type: 'text', text: "It's where King Abdulaziz recaptured Riyadh in 1902 — the start of the modern Saudi state. Look for the spearhead lodged in the wooden gate." }, demoNotice], '15:21'],
      ['user', [{ type: 'text', text: "What's nearby?" }], '15:23'],
      ['assistant', [{ type: 'text', text: 'Two places are within walking distance:' }, { type: 'recommendations', items: [{ ref: place('plc_souq_zal'), priority: 'recommended', reason: tx('سوق تقليدي بجوار المصمك.', 'A traditional souq next door.') }, { ref: place('plc_murabba'), priority: 'optional', reason: tx('قصر الملك عبدالعزيز.', "King Abdulaziz's palace.") }] }], '15:24'],
    ],
  },
  {
    conversation: { id: 'conv_family_day', characterId: 'arif', title: 'يوم عائلي', locale: 'ar', createdAt: at(-12, '18:00'), updatedAt: at(-12, '18:02') },
    messages: [
      ['user', [{ type: 'text', text: 'وين أروح مع أطفالي في الرياض؟' }], '18:00'],
      ['assistant', [{ type: 'text', text: 'هذه أماكن مناسبة للعائلات:' }, { type: 'recommendations', items: [{ ref: place('plc_king_abdullah_park'), priority: 'high', reason: tx('مساحات خضراء ونافورة مساءً.', 'Lawns and an evening fountain.') }, { ref: place('plc_national_museum'), priority: 'recommended', reason: tx('قاعات مكيفة ومناسبة للأطفال.', 'Air-conditioned, child-friendly galleries.') }] }, demoNotice], '18:02'],
    ],
  },
  {
    conversation: { id: 'conv_expo_ai', characterId: 'roaya', title: 'Expo AI half-day', locale: 'en', context: { kind: 'planner' }, createdAt: at(0, '09:10'), updatedAt: at(0, '09:12') },
    messages: [
      ['user', [{ type: 'text', text: 'Plan a half day at Expo focused on AI and tech' }], '09:10'],
      ['assistant', [{ type: 'text', text: 'Here is a half-day proposal starting at 10:00. Times include an estimated 5-minute buffer.' }, { type: 'itinerary-proposal', proposal: UNSAVED_PROPOSAL }, demoNotice], '09:12'],
    ],
  },
  {
    conversation: { id: 'conv_expo_booths', characterId: 'roaya', title: 'أجنحة التقنية في إكسبو', locale: 'ar', createdAt: at(-2, '20:30'), updatedAt: at(-2, '20:31') },
    messages: [
      ['user', [{ type: 'text', text: 'ما أهم أجنحة التقنية في إكسبو؟' }], '20:30'],
      ['assistant', [{ type: 'text', text: 'هذه أجنحة توضيحية من البيانات التجريبية:' }, { type: 'recommendations', items: [{ ref: booth('booth_ai_experience'), priority: 'high', reason: tx('تجربة تفاعلية مع الذكاء الاصطناعي.', 'Hands-on AI experience.') }, { ref: booth('booth_mobility_hub'), priority: 'recommended', reason: tx('مركبات ذاتية القيادة.', 'Autonomous vehicles.') }] }, demoNotice], '20:31'],
    ],
  },
  {
    conversation: { id: 'conv_sustainability', characterId: 'roaya', title: 'Sustainability pavilions', locale: 'en', createdAt: at(-20, '11:00'), updatedAt: at(-20, '11:01') },
    messages: [
      ['user', [{ type: 'text', text: 'Which pavilions are about sustainability?' }], '11:00'],
      ['assistant', [{ type: 'text', text: 'From the illustrative demo layout:' }, { type: 'recommendations', items: [{ ref: booth('booth_green_energy'), priority: 'high', reason: tx('الطاقة الشمسية والرياح.', 'Solar and wind power.') }, { ref: booth('booth_water_future'), priority: 'recommended', reason: tx('تقنيات المياه.', 'Water technologies.') }] }, demoNotice], '11:01'],
    ],
  },
];

/** Seed for the persistent demo store. */
export function seedConversations(): { conversations: Conversation[]; messages: ChatMessage[] } {
  const seeds = SEEDS();
  const dayOf = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000);
  };
  return {
    conversations: seeds.map((s) => s.conversation),
    messages: seeds.flatMap(({ conversation, messages }) =>
      messages.map(([role, blocks, time], i): ChatMessage => ({
        id: `msg_${conversation.id.slice(5)}_${i + 1}`,
        conversationId: conversation.id,
        role,
        blocks,
        status: 'done',
        createdAt: at(dayOf(conversation.createdAt), time),
      })),
    ),
  };
}
