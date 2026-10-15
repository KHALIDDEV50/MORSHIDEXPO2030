import type { ScenarioId } from '../../model/intent';

/**
 * DEMO assistant copy (docs/demo-data.md §3). Canned, bilingual, and always followed by a
 * "demo replies" notice — never presented as real AI. Text is markdown-lite: paragraphs,
 * "- " bullets and **bold**. Recommendations only reference verified places / demo booths.
 */
const tx = (ar: string, en: string) => ({ ar, en });
type Tx = ReturnType<typeof tx>;
type Priority = 'high' | 'recommended' | 'optional';

export type RecommendationSeed = { ref: string; priority: Priority; reason: Tx };
export type ProposalSeed = {
  title: Tx;
  type: 'tourism' | 'expo';
  startTime: string;
  bufferMin: number;
  rationale: Tx;
  stops: (RecommendationSeed & { durationMin?: number })[];
};

export type ScenarioCopy = {
  /** Opening line in the character's voice */
  intro: { arif: Tx; roaya: Tx };
  body: Tx;
  recommendations?: RecommendationSeed[];
  proposal?: ProposalSeed;
};

export const SCENARIOS: Record<Exclude<ScenarioId, 'S9_place_followup' | 'fallback'>, ScenarioCopy> = {
  S1_heritage_sites: {
    intro: {
      arif: tx('سؤال رائع! الرياض مدينة تحكي قصتها في كل زاوية.', 'Great question! Riyadh tells its story on every corner.'),
      roaya: tx('هذه أهم المواقع التاريخية، مرتبة حسب الأولوية.', 'Here are the key historical sites, in order of priority.'),
    },
    body: tx(
      'ابدأ من **الديرة** في قلب المدينة القديمة، ثم توجّه إلى **الدرعية** مهد الدولة السعودية الأولى.\n\n- الأماكن في الديرة متقاربة ويمكن زيارتها سيرًا.\n- حي الطريف أجمل قبيل الغروب.',
      'Start in **Al-Dirah**, the heart of the old city, then head to **Diriyah**, birthplace of the first Saudi state.\n\n- The Al-Dirah sites are close together and walkable.\n- At-Turaif is most beautiful before sunset.',
    ),
    recommendations: [
      { ref: 'plc_masmak', priority: 'high', reason: tx('بداية قصة الرياض الحديثة عام 1902.', 'Where the story of modern Riyadh began in 1902.') },
      { ref: 'plc_turaif', priority: 'high', reason: tx('موقع تراث عالمي لليونسكو.', 'A UNESCO World Heritage Site.') },
      { ref: 'plc_national_museum', priority: 'recommended', reason: tx('أشمل قصة للجزيرة العربية في مكان واحد.', "Arabia's fullest story under one roof.") },
      { ref: 'plc_murabba', priority: 'recommended', reason: tx('قصر الملك عبدالعزيز بالطراز النجدي.', "King Abdulaziz's palace in Najdi style.") },
      { ref: 'plc_souq_zal', priority: 'optional', reason: tx('سوق تقليدي بجوار المصمك.', 'A traditional souq next to Masmak.') },
    ],
  },
  S2_modern_riyadh: {
    intro: {
      arif: tx('الرياض الحديثة مذهلة أيضًا! انظر إلى هذا الأفق.', 'Modern Riyadh is stunning too — look at that skyline!'),
      roaya: tx('هذه معالم العمارة الحديثة التي تستحق الزيارة.', 'These are the modern architecture highlights worth seeing.'),
    },
    body: tx(
      'الأمسيات أفضل وقت لرؤية أفق المدينة المضاء.\n\n- ابدأ بالمشي في **مركز الملك عبدالله المالي**.\n- اختم بإطلالة **جسر السماء** بعد الغروب.',
      'Evenings are the best time to see the lit-up skyline.\n\n- Start with a walk around **KAFD**.\n- Finish with the **Sky Bridge** view after sunset.',
    ),
    recommendations: [
      { ref: 'plc_kafd', priority: 'high', reason: tx('عمارة معاصرة ومحطة مترو مميزة.', 'Contemporary architecture and a landmark metro station.') },
      { ref: 'plc_kingdom_centre', priority: 'high', reason: tx('أشهر إطلالة على أفق الرياض.', "Riyadh's best-known skyline view.") },
      { ref: 'plc_king_abdullah_park', priority: 'optional', reason: tx('استراحة خضراء ونافورة مساءً.', 'A green break with an evening fountain.') },
    ],
  },
  S3_family_day: {
    intro: {
      arif: tx('يوم عائلي؟ فكرة جميلة!', 'A family day? Lovely idea!'),
      roaya: tx('هذه أماكن مريحة ومناسبة للعائلات.', 'Here are relaxed, family-friendly places.'),
    },
    body: tx(
      'اقتراحي: صباح في متحف مكيّف، ثم مساء في الهواء الطلق.\n\n- خذوا فترات راحة بين الأماكن.\n- المساء ألطف في الحدائق.',
      'My suggestion: an air-conditioned museum in the morning, then the outdoors in the evening.\n\n- Plan breaks between places.\n- Parks are nicer in the evening.',
    ),
    recommendations: [
      { ref: 'plc_national_museum', priority: 'high', reason: tx('قاعات مكيفة ومناسبة للأطفال.', 'Air-conditioned, child-friendly galleries.') },
      { ref: 'plc_king_abdullah_park', priority: 'high', reason: tx('مساحات خضراء ونافورة مساءً.', 'Lawns and an evening fountain.') },
      { ref: 'plc_bujairi', priority: 'recommended', reason: tx('عشاء بإطلالة على الطريف.', 'Dinner overlooking At-Turaif.') },
      { ref: 'plc_murabba', priority: 'optional', reason: tx('زيارة قصيرة قرب المتحف.', 'A short visit next to the museum.') },
    ],
  },
  S4_food: {
    intro: {
      arif: tx('آه، الأكل النجدي! هذا من أحب المواضيع إليّ.', 'Ah, Najdi food — one of my favourite topics!'),
      roaya: tx('هذه أماكن مناسبة لتجربة الطعام والقهوة.', 'Here are good places to try food and coffee.'),
    },
    body: tx(
      'جرّب **الكبسة** و**الجريش** و**المرقوق**، ولا تفوّت **القهوة السعودية** مع التمر.\n\n- أسماء المطاعم تتغير، لذلك أرشّح مناطق لا مطاعم بعينها.\n- تحقّق من الأوقات قبل الذهاب.',
      'Try **kabsa**, **jareesh** and **marqooq**, and don\'t miss **Saudi coffee** with dates.\n\n- Restaurants change, so I suggest areas rather than specific restaurants.\n- Check opening times before you go.',
    ),
    recommendations: [
      { ref: 'plc_bujairi', priority: 'high', reason: tx('مطاعم ومقاهٍ بإطلالة تاريخية.', 'Restaurants and cafés with a historic view.') },
      { ref: 'plc_souq_zal', priority: 'recommended', reason: tx('أجواء السوق القديم والتمور والبهارات.', 'Old-market atmosphere, dates and spices.') },
      { ref: 'plc_kingdom_centre', priority: 'optional', reason: tx('خيارات متنوعة في مركز التسوق.', 'A wide choice inside the mall.') },
    ],
  },
  S5_beyond_riyadh: {
    intro: {
      arif: tx('المملكة واسعة ومليئة بالكنوز!', 'The Kingdom is vast and full of treasures!'),
      roaya: tx('هذه أبرز الوجهات خارج الرياض، كلٌّ منها يستحق رحلة مستقلة.', 'These are the top destinations beyond Riyadh — each deserves its own trip.'),
    },
    body: tx(
      'معظمها يحتاج طيرانًا داخليًا أو يومًا كاملًا.\n\n- **الحجر** بحجز مسبق.\n- **حافة العالم** قريبة نسبيًا لكنها تحتاج سيارة دفع رباعي.',
      'Most need a domestic flight or a full day.\n\n- **Hegra** requires advance booking.\n- **Edge of the World** is relatively close but needs a 4×4.',
    ),
    recommendations: [
      { ref: 'plc_hegra', priority: 'high', reason: tx('أول موقع سعودي في قائمة اليونسكو.', "Saudi Arabia's first UNESCO site.") },
      { ref: 'plc_historic_jeddah', priority: 'high', reason: tx('بيوت المرجان والرواشين.', 'Coral-stone houses and rawasheen.') },
      { ref: 'plc_soudah', priority: 'recommended', reason: tx('هواء جبلي بارد فوق أبها.', 'Cool mountain air above Abha.') },
      { ref: 'plc_edge_world', priority: 'optional', reason: tx('رحلة يومية من الرياض.', 'A day trip from Riyadh.') },
    ],
  },
  S6_expo_ai_booths: {
    intro: {
      arif: tx('إكسبو سيكون مليئًا بالمفاجآت التقنية!', 'Expo will be full of tech surprises!'),
      roaya: tx('هذه أجنحة الذكاء الاصطناعي والتقنية — من المخطط التوضيحي التجريبي.', 'Here are the AI and technology pavilions — from the illustrative demo layout.'),
    },
    body: tx(
      'معظمها في **منطقة التقنيات (3)**، ومعرض طب المستقبل في **منطقة الإنسانيات (4)** المجاورة، لذلك يسهل الجمع بينها.\n\n- الأجنحة والأوقات بيانات تجريبية، وليست المخطط الرسمي لإكسبو.',
      'Most are in **Technology (zone 3)**, with Future Medicine next door in **Humanity (zone 4)**, so they are easy to combine.\n\n- Pavilions and times are demo data, not the official Expo layout.',
    ),
    recommendations: [
      { ref: 'booth_ai_experience', priority: 'high', reason: tx('تجربة تفاعلية وورشة للمبتدئين.', 'Hands-on, with a beginners workshop.') },
      { ref: 'booth_digital_innovation', priority: 'high', reason: tx('عرض الروبوتات الساعة 11:00 (تجريبي).', 'Robotics show at 11:00 (demo).') },
      { ref: 'booth_future_cities', priority: 'recommended', reason: tx('نماذج المدن الذكية.', 'Smart-city models.') },
      { ref: 'booth_space_lab', priority: 'optional', reason: tx('محاكاة قصيرة وممتعة.', 'A short, fun simulation.') },
      { ref: 'booth_future_medicine', priority: 'optional', reason: tx('التقنية في الطب.', 'Technology in medicine.') },
    ],
  },
  S7_expo_itinerary: {
    intro: {
      arif: tx('جهّزت لك نصف يوم تقني في إكسبو!', "I've put together a tech half-day at Expo!"),
      roaya: tx('هذا اقتراح لنصف يوم مركّز يبدأ الساعة 10:00.', "Here's a focused half-day proposal starting at 10:00."),
    },
    body: tx(
      'المحطات متجاورة في منطقة التقنيات (3)، والأوقات تقديرية مع 5 دقائق بين كل محطة.\n\nراجع المقترح، احذف ما لا يناسبك، ثم احفظه في «خططي».',
      'The stops sit next to each other in the Technology district (zone 3); times are estimates with 5 minutes between stops.\n\nReview the proposal, remove what you don\'t need, then save it to My Plans.',
    ),
    proposal: {
      title: tx('نصف يوم في إكسبو: الذكاء الاصطناعي والتقنية', 'Expo half-day: AI & Tech'),
      type: 'expo',
      startTime: '10:00',
      bufferMin: 5,
      rationale: tx('رتّبت الأجنحة حسب مواعيد العروض التجريبية وقربها من بعضها.', 'Ordered by the demo show times and how close the pavilions are.'),
      stops: [
        { ref: 'booth_digital_innovation', priority: 'high', reason: tx('عرض الروبوتات الساعة 11:00.', 'Robotics show at 11:00.') },
        { ref: 'booth_ai_experience', priority: 'high', reason: tx('ورشة للمبتدئين.', 'A beginners workshop.') },
        { ref: 'booth_future_cities', priority: 'recommended', reason: tx('نماذج المدن الذكية.', 'Smart-city models.') },
        { ref: 'booth_space_lab', priority: 'optional', reason: tx('محاكاة قصيرة لختام الجولة.', 'A short simulation to finish.') },
      ],
    },
  },
  S8_heritage_itinerary: {
    intro: {
      arif: tx('يوم تراثي كامل؟ هيا بنا!', "A full heritage day? Let's go!"),
      roaya: tx('هذا اقتراح ليوم واحد يبدأ الساعة 08:30.', "Here's a one-day proposal starting at 08:30."),
    },
    body: tx(
      'الصباح في **الديرة** حيث الأماكن متقاربة، والمساء في **الدرعية**. الأوقات تقديرية مع 15 دقيقة بين المحطات — وليست أوقات تنقّل حقيقية.\n\nراجع المقترح ثم احفظه في «خططي».',
      'Mornings in **Al-Dirah**, where everything is close, and the evening in **Diriyah**. Times are estimates with 15 minutes between stops — not real travel times.\n\nReview the proposal, then save it to My Plans.',
    ),
    proposal: {
      title: tx('يوم تراثي في الرياض', 'A heritage day in Riyadh'),
      type: 'tourism',
      startTime: '08:30',
      bufferMin: 15,
      rationale: tx('بدأت بالأماكن المتقاربة صباحًا، وتركت الدرعية لما قبل الغروب.', 'Close-together sites in the morning; Diriyah saved for before sunset.'),
      stops: [
        { ref: 'plc_masmak', priority: 'high', reason: tx('بداية القصة.', 'Where the story begins.') },
        { ref: 'plc_souq_zal', priority: 'optional', reason: tx('بجوار المصمك مباشرة.', 'Right next to Masmak.') },
        { ref: 'plc_murabba', priority: 'recommended', reason: tx('قصر الملك عبدالعزيز.', "King Abdulaziz's palace.") },
        { ref: 'plc_national_museum', priority: 'high', reason: tx('قصة الجزيرة العربية.', "Arabia's story.") },
        { ref: 'plc_turaif', priority: 'high', reason: tx('قبيل الغروب.', 'Before sunset.') },
        { ref: 'plc_bujairi', priority: 'recommended', reason: tx('عشاء بإطلالة على الطريف.', 'Dinner facing At-Turaif.') },
      ],
    },
  },
};

export const FALLBACK = {
  intro: {
    arif: tx('أعتذر، هذا خارج ما أستطيع الإجابة عنه في هذه النسخة التجريبية.', "Sorry — that's outside what I can answer in this demo."),
    roaya: tx('هذا السؤال خارج المواضيع المتاحة في النسخة التجريبية.', "That question is outside the topics this demo supports."),
  },
  body: tx(
    'هذه نسخة تجريبية بردود محددة مسبقًا. يمكنني مساعدتك في:\n\n- أهم المواقع التاريخية في الرياض\n- الرياض الحديثة والعمارة\n- يوم عائلي\n- الطعام والمقاهي\n- وجهات خارج الرياض\n- أجنحة الذكاء الاصطناعي في إكسبو\n- خطة نصف يوم في إكسبو\n- خطة تراثية ليوم واحد\n- أسئلة عن مكان محدد (تاريخه، ماذا أشاهد، ما القريب منه)',
    'This is a demo with predefined replies. I can help with:\n\n- The most important historical sites in Riyadh\n- Modern Riyadh and architecture\n- A family day\n- Food and cafés\n- Destinations beyond Riyadh\n- AI pavilions at Expo\n- A half-day Expo itinerary\n- A one-day heritage itinerary\n- Questions about a specific place (its history, what to see, what\'s nearby)',
  ),
};

export const FOLLOW_UP_COPY = {
  history: tx('هذه لمحة عن تاريخ {name}:', "Here's a little history of {name}:"),
  focus: tx('أهم ما تنتبه له في {name}:', 'What to look out for at {name}:'),
  nearby: tx('أماكن من الدليل قريبة من {name} (حسب الإحداثيات الموثّقة):', 'Guide places close to {name} (by their verified coordinates):'),
  nearbyNone: tx('لا توجد أماكن أخرى من الدليل قريبة من {name}.', 'There are no other guide places close to {name}.'),
  overview: tx('إليك نبذة عن {name}:', "Here's an overview of {name}:"),
  nearbyReason: tx('قريب من {name}.', 'Close to {name}.'),
};

export const DEMO_NOTICE = tx('ردود تجريبية — ليست ذكاءً اصطناعيًا حقيقيًا.', 'Demo replies — not a real AI.');
export const OUT_OF_CREDITS_NOTICE = tx(
  'نفد رصيدك التجريبي. يمكنك مراجعة الباقات في «الاشتراك والرصيد».',
  "You're out of demo credits. See plans under Subscription & credits.",
);
