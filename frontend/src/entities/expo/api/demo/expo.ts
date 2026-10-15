import type { ExpoBooth, ExpoBoothCategory, ExpoConceptImage, ExpoFacility, ExpoFacilityKind, ExpoLayout, ExpoZone } from '../../model/expo';

/**
 * DEMO Expo venue — an ILLUSTRATIVE site plan (docs/demo-data.md §2, P-023). The four thematic
 * districts (الأرض Earth · التعاون Collaboration · التقنيات Technology · الإنسانيات Humanity) are
 * MORSHID's own way of organising the demo — not official Expo 2030 Riyadh zones, boundaries,
 * names or pavilion assignments. Pavilions, activities, times and facilities are FICTIONAL.
 *
 * Composition (x 0–1000, y 0–700, y down = south), inspired by the reference aerial rendering:
 *   a near-circular site; the central plaza (5) with the main stage and visitor services and a
 *   keyhole avenue to the south gate; four petal districts — 1 Earth (NW), 2 Collaboration (NE),
 *   3 Technology (SE), 4 Humanity (SW) — separated by boulevards on the N/E/S/W axes and ringed
 *   by illuminated promenades. The geometry was generated once by a script and checked so that
 *   every pavilion and facility lies inside its zone. Location numbers are "<zone>.<index>".
 */
const tx = (ar: string, en: string) => ({ ar, en });

/** Concept renderings supplied in /expo-images (copied to /public/images/expo/concept). */
const CONCEPT_CREDIT = 'Concept rendering of Expo 2030 Riyadh · supplied with the project (source and usage rights to be confirmed)';
const concept = (file: string, ar: string, en: string): ExpoConceptImage => ({ src: `/images/expo/concept/${file}`, alt: tx(ar, en), kind: 'concept-rendering', credit: CONCEPT_CREDIT });

export const EXPO_CONCEPT_IMAGES = {
  siteNight: concept('site-aerial-night.png', 'تصوّر جوي ليلي لموقع إكسبو 2030 الرياض', 'Night aerial concept rendering of the Expo 2030 Riyadh site'),
  siteDusk: concept('site-aerial-dusk.jpg', 'تصوّر جوي لموقع إكسبو 2030 الرياض عند الغروب', 'Dusk aerial concept rendering of the Expo 2030 Riyadh site'),
  towerGarden: concept('tower-garden.webp', 'تصوّر لبرج مظلّل وسط حدائق وممرات', 'Concept rendering of a shaded tower among gardens and walkways'),
  gatheringPlaza: concept('gathering-plaza.jpg', 'تصوّر لساحة تجمّع للزوار عند الغروب', 'Concept rendering of a visitor gathering plaza at sunset'),
  towerInterior: concept('tower-interior.webp', 'تصوّر لمنصات مضيئة داخل هيكل شجري', 'Concept rendering of illuminated platforms inside a tree-like structure'),
  conePavilions: concept('cone-pavilions.webp', 'تصوّر لأجنحة مخروطية بزخارف هندسية', 'Concept rendering of cone-shaped pavilions with geometric patterns'),
  towerDusk: concept('tower-dusk.jpg', 'تصوّر لبرج الحدائق وساحات الزوار عند الغروب', 'Concept rendering of the garden tower and visitor terraces at dusk'),
} satisfies Record<string, ExpoConceptImage>;

const zone = (
  id: string,
  number: number,
  kind: 'theme' | 'hub',
  name: [string, string],
  summary: [string, string],
  color: string,
  polygon: [number, number][],
  labelAt: [number, number],
  image: ExpoConceptImage,
): ExpoZone => ({ id, number, kind, name: tx(name[0], name[1]), summary: tx(summary[0], summary[1]), color, polygon, labelAt, image, provenance: 'demo' });

export const DEMO_ZONES: ExpoZone[] = [
  zone('zone_earth', 1, 'theme', ['الأرض', 'Earth'], ['الطبيعة والطاقة النظيفة والمياه وحديقة الصحراء الحيّة.', 'Nature, clean energy, water and a living desert garden.'], 'amber', [[69, 301], [72, 269], [84, 237], [105, 208], [134, 182], [166, 159], [198, 137], [231, 115], [265, 93], [303, 74], [346, 59], [392, 51], [439, 49], [479, 238], [446, 244], [417, 254], [391, 268], [370, 285], [355, 306], [347, 327]], [212, 164], EXPO_CONCEPT_IMAGES.towerGarden),
  zone('zone_collaboration', 2, 'theme', ['التعاون', 'Collaboration'], ['جناح الأمم والموسيقى والسينما وشبكات تربط المدن والناس.', 'The Nations Pavilion, music, film and networks that connect cities and people.'], 'pink', [[561, 49], [608, 51], [654, 59], [697, 74], [735, 93], [769, 115], [802, 137], [834, 159], [866, 182], [895, 208], [916, 237], [928, 269], [931, 301], [653, 327], [645, 306], [630, 285], [609, 268], [583, 254], [554, 244], [521, 238]], [648, 164], EXPO_CONCEPT_IMAGES.gatheringPlaza),
  zone('zone_technology', 3, 'theme', ['التقنيات', 'Technology'], ['الذكاء الاصطناعي والفضاء والمدن الذكية والتنقل الجوي.', 'AI, space, smart cities and urban air mobility.'], 'blue', [[931, 383], [928, 415], [916, 447], [895, 476], [866, 502], [834, 525], [802, 547], [769, 569], [735, 591], [697, 610], [654, 625], [608, 633], [561, 635], [521, 446], [554, 440], [583, 430], [609, 416], [630, 399], [645, 378], [653, 357]], [648, 460], EXPO_CONCEPT_IMAGES.towerInterior),
  zone('zone_humanity', 4, 'theme', ['الإنسانيات', 'Humanity'], ['الخط العربي والحِرف وطب المستقبل وجودة الحياة والعائلة.', 'Arabic calligraphy, crafts, future medicine, wellbeing and family.'], 'violet', [[439, 635], [392, 633], [346, 625], [303, 610], [265, 591], [231, 569], [198, 547], [166, 525], [134, 502], [105, 476], [84, 447], [72, 415], [69, 383], [347, 357], [355, 378], [370, 399], [391, 416], [417, 430], [446, 440], [479, 446]], [212, 460], EXPO_CONCEPT_IMAGES.conePavilions),
  zone('zone_plaza', 5, 'hub', ['الساحة المركزية والمدخل', 'Central Plaza & Gate'], ['المسرح الرئيسي والبوابة وخدمات الزوار — ليست منطقة موضوعية.', 'Main stage, gate and visitor services — not a thematic district.'], 'cyan', [[612, 342], [608, 362], [597, 380], [579, 396], [545, 402], [545, 641], [455, 641], [455, 402], [421, 396], [403, 380], [392, 362], [388, 342], [392, 322], [403, 304], [421, 288], [444, 276], [471, 268], [500, 266], [529, 268], [556, 276], [579, 288], [597, 304], [608, 322]], [452, 292], EXPO_CONCEPT_IMAGES.towerDusk),
];

/** Site boundary and walkways (illustrative). */
export const DEMO_SITE: ExpoLayout['site'] = [[968, 342], [972, 399], [944, 452], [897, 498], [853, 543], [806, 590], [739, 623], [659, 638], [579, 647], [500, 660], [417, 663], [339, 643], [271, 611], [204, 582], [136, 550], [86, 504], [64, 450], [50, 396], [32, 342], [28, 285], [56, 232], [103, 186], [147, 141], [194, 94], [261, 61], [341, 46], [421, 37], [500, 24], [583, 21], [661, 41], [729, 73], [796, 102], [864, 134], [914, 180], [936, 234], [950, 288]];
export const DEMO_PATHS: ExpoLayout['paths'] = [
  // Plaza ring, district ring, outer promenade
  [[636, 342], [631, 366], [618, 388], [596, 407], [568, 422], [535, 431], [500, 434], [465, 431], [432, 422], [404, 407], [382, 388], [369, 366], [364, 342], [369, 318], [382, 296], [404, 277], [432, 262], [465, 253], [500, 250], [535, 253], [568, 262], [596, 277], [618, 296], [631, 318], [636, 342]],
  [[800, 342], [795, 377], [781, 412], [759, 444], [729, 473], [693, 498], [650, 518], [602, 533], [552, 542], [500, 546], [448, 542], [398, 533], [350, 518], [307, 498], [271, 473], [241, 444], [219, 412], [205, 377], [200, 342], [205, 307], [219, 272], [241, 240], [271, 211], [307, 186], [350, 166], [398, 151], [448, 142], [500, 138], [552, 142], [602, 151], [650, 166], [693, 186], [729, 211], [759, 240], [781, 272], [795, 307], [800, 342]],
  [[952, 342], [947, 385], [934, 427], [913, 467], [883, 505], [846, 539], [802, 570], [753, 596], [698, 618], [640, 634], [578, 644], [516, 649], [453, 647], [391, 640], [331, 627], [274, 608], [222, 584], [175, 555], [135, 522], [101, 486], [76, 447], [58, 406], [49, 363], [49, 321], [58, 278], [76, 237], [101, 198], [135, 162], [175, 129], [222, 100], [274, 76], [331, 57], [391, 44], [453, 37], [516, 35], [578, 40], [640, 50], [698, 66], [753, 88], [802, 114], [846, 145], [883, 179], [913, 217], [934, 257], [947, 299], [952, 342]],
  // Boulevards (N, E, W) and the gate avenue (S)
  [[500, 256], [500, 29]],
  [[626, 342], [961, 342]],
  [[374, 342], [39, 342]],
  [[500, 428], [500, 641]],
];

/** Whole-site imagery for the map's overview panel (concept renderings, labelled as such). */
export const DEMO_OVERVIEW_IMAGES = [EXPO_CONCEPT_IMAGES.siteNight, EXPO_CONCEPT_IMAGES.siteDusk];

/**
 * Theme images per pavilion category (Wikimedia Commons photos with free licenses, and one
 * concept rendering — docs/image-credits.md). The pavilions are fictional, so these are
 * ILLUSTRATIVE images of the theme, never of the pavilion itself; the UI says so next to every one.
 */
const CATEGORY_PHOTO: Record<ExpoBoothCategory, ExpoBooth['images'][number]> = {
  'ai-tech': { src: '/images/expo/ai-tech.jpg', alt: tx('روبوت بشري في معرض تقني', 'A humanoid robot at a technology exhibition'), placeholder: false, illustrative: true, credit: 'Om Umekar · CC BY-SA 4.0 · Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Humanoid_Robot_at_International_Exhibitions.jpg' },
  'culture': { src: '/images/expo/culture.jpg', alt: tx('خط عربي على قطع خشبية', 'Arabic calligraphy on wooden pieces'), placeholder: false, illustrative: true, credit: 'Mohammad Hijjawi · CC BY-SA 4.0 · Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Arabic_calligraphy_on_wood.jpg' },
  'sustainability': { src: '/images/expo/sustainability.jpg', alt: tx('ألواح طاقة شمسية', 'Solar panels'), placeholder: false, illustrative: true, credit: 'Dennis Schroeder - NREL Photographer · Public domain · Wikimedia Commons', license: 'Public domain', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Solar_panels_in_the_desert.jpg' },
  'mobility': { src: '/images/expo/mobility.jpg', alt: tx('داخل عربة قطار مترو الرياض', 'Inside a Riyadh Metro train car'), placeholder: false, illustrative: true, credit: 'ubahnverleih · CC0 · Wikimedia Commons', license: 'CC0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Riyadh_Metro_-_innoTrans_2016.jpg' },
  'health': { src: '/images/expo/health.jpg', alt: tx('جراح يستخدم روبوتًا جراحيًا', 'A surgeon using a surgical robot'), placeholder: false, illustrative: true, credit: 'Navy Medicine · Public domain · Wikimedia Commons', license: 'Public domain', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Surgeon_performing_robot-assisted_surgery.jpg' },
  // No photo of a real Expo: the Expo 2030 Riyadh site itself, as a labelled concept rendering (P-026)
  'countries': { src: EXPO_CONCEPT_IMAGES.siteDusk.src, alt: EXPO_CONCEPT_IMAGES.siteDusk.alt, placeholder: false, illustrative: true, credit: CONCEPT_CREDIT },
  'events': { src: '/images/expo/events.jpg', alt: tx('حفل موسيقي على مسرح مضاء', 'A concert on a lit stage'), placeholder: false, illustrative: true, credit: 'Shixart1985 · CC BY 2.0 · Wikimedia Commons', license: 'CC BY 2.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:A_large_crowd_enjoys_a_music_concert_illuminated_by_colorful_lights_and_a_stunning_stage_display.jpg' },
};

type BoothSeed = {
  key: string;
  number: string;
  zoneId: string;
  category: ExpoBoothCategory;
  name: [string, string];
  summary: [string, string];
  activity: [string, string, string];
  durationMin: number;
  position: [number, number];
};

const BOOTHS: BoothSeed[] = [
  // 1 · Earth
  { key: 'green_energy', number: '1.1', zoneId: 'zone_earth', category: 'sustainability', name: ['جناح الطاقة الخضراء', 'Green Energy Pavilion'], summary: ['الطاقة الشمسية والرياح بطريقة مبسطة.', 'Solar and wind power, simply explained.'], activity: ['تجربة توليد الطاقة', 'Power-generation demo', '11:30'], durationMin: 40, position: [300, 273] },
  { key: 'water_future', number: '1.2', zoneId: 'zone_earth', category: 'sustainability', name: ['جناح مستقبل المياه', 'Future of Water Pavilion'], summary: ['تقنيات تحلية المياه وإعادة استخدامها.', 'Desalination and water-reuse technologies.'], activity: ['عرض تفاعلي', 'Interactive show', '13:30'], durationMin: 35, position: [398, 206] },
  { key: 'desert_garden', number: '1.3', zoneId: 'zone_earth', category: 'sustainability', name: ['حديقة الصحراء الحية', 'Living Desert Garden'], summary: ['نباتات محلية وزراعة موفرة للمياه.', 'Native plants and water-wise farming.'], activity: ['جولة الحديقة', 'Garden walk', '17:30'], durationMin: 30, position: [282, 194] },
  { key: 'circular_design', number: '1.4', zoneId: 'zone_earth', category: 'sustainability', name: ['معرض التصميم الدائري', 'Circular Design Gallery'], summary: ['منتجات من مواد معاد تدويرها.', 'Products made from recycled materials.'], activity: ['ورشة إعادة التدوير', 'Upcycling workshop', '15:30'], durationMin: 45, position: [150, 251] },
  // 2 · Collaboration
  { key: 'nations', number: '2.1', zoneId: 'zone_collaboration', category: 'countries', name: ['جناح الأمم (توضيحي)', 'Nations Pavilion (illustrative)'], summary: ['جناح توضيحي يمثّل مشاركة الدول — لا يذكر دولًا حقيقية.', 'An illustrative pavilion for participating nations — names no real country.'], activity: ['عرض ثقافي', 'Cultural show', '15:00'], durationMin: 45, position: [602, 206] },
  { key: 'music_hall', number: '2.2', zoneId: 'zone_collaboration', category: 'culture', name: ['قاعة الموسيقى العالمية', 'World Music Hall'], summary: ['عروض موسيقية من ثقافات مختلفة.', 'Music performances from many cultures.'], activity: ['حفل مسائي', 'Evening concert', '20:00'], durationMin: 60, position: [700, 273] },
  { key: 'film_dome', number: '2.3', zoneId: 'zone_collaboration', category: 'culture', name: ['قبة السينما', 'Film Dome'], summary: ['أفلام قصيرة على شاشة دائرية.', 'Short films on a 360° screen.'], activity: ['عرض الفيلم', 'Screening', '19:00'], durationMin: 30, position: [718, 194] },
  { key: 'mobility_hub', number: '2.4', zoneId: 'zone_collaboration', category: 'mobility', name: ['مركز التنقل المستقبلي', 'Future Mobility Hub'], summary: ['مركبات ذاتية القيادة ووسائل نقل جديدة.', 'Autonomous vehicles and new ways to travel.'], activity: ['عرض المركبات', 'Vehicle showcase', '10:30'], durationMin: 45, position: [634, 104] },
  { key: 'rail_future', number: '2.5', zoneId: 'zone_collaboration', category: 'mobility', name: ['معرض قطارات المستقبل', 'Future Rail Gallery'], summary: ['قصة شبكات القطارات الحديثة.', 'The story of modern rail networks.'], activity: ['عرض نموذج مصغّر', 'Scale-model show', '16:00'], durationMin: 30, position: [850, 251] },
  // 3 · Technology
  { key: 'digital_innovation', number: '3.1', zoneId: 'zone_technology', category: 'ai-tech', name: ['جناح الابتكار الرقمي', 'Digital Innovation Pavilion'], summary: ['تجارب تفاعلية عن مستقبل التقنية.', 'Interactive experiences about the future of technology.'], activity: ['عرض الروبوتات', 'Robotics show', '11:00'], durationMin: 45, position: [700, 411] },
  { key: 'ai_experience', number: '3.2', zoneId: 'zone_technology', category: 'ai-tech', name: ['قاعة تجربة الذكاء الاصطناعي', 'AI Experience Hall'], summary: ['حاور أنظمة ذكاء اصطناعي وتعرّف على طريقة عملها.', 'Talk to AI systems and see how they work.'], activity: ['ورشة الذكاء الاصطناعي للمبتدئين', 'AI for beginners workshop', '13:00'], durationMin: 60, position: [602, 478] },
  { key: 'space_lab', number: '3.3', zoneId: 'zone_technology', category: 'ai-tech', name: ['مختبر الفضاء', 'Space Lab'], summary: ['محاكاة لرحلة إلى المدار.', 'A simulated trip to orbit.'], activity: ['محاكاة الإطلاق', 'Launch simulation', '12:30'], durationMin: 30, position: [718, 490] },
  { key: 'future_cities', number: '3.4', zoneId: 'zone_technology', category: 'ai-tech', name: ['معرض المدن الذكية', 'Smart Cities Gallery'], summary: ['نماذج لمدن تُدار بالبيانات.', 'Models of data-driven cities.'], activity: ['جولة مصحوبة بمرشد', 'Guided tour', '15:00'], durationMin: 40, position: [850, 433] },
  { key: 'air_taxi', number: '3.5', zoneId: 'zone_technology', category: 'mobility', name: ['جناح التاكسي الجوي', 'Air Taxi Pavilion'], summary: ['تعرّف على النقل الجوي داخل المدن.', 'Discover urban air transport.'], activity: ['تجربة الواقع الافتراضي', 'VR flight experience', '14:00'], durationMin: 30, position: [634, 580] },
  { key: 'micro_mobility', number: '3.6', zoneId: 'zone_technology', category: 'mobility', name: ['مسار تجربة التنقل الخفيف', 'Micro-Mobility Test Track'], summary: ['دراجات وسكوترات كهربائية للتجربة.', 'Electric bikes and scooters to try.'], activity: ['مسار التجربة', 'Test-ride track', '17:00'], durationMin: 25, position: [785, 535] },
  // 4 · Humanity
  { key: 'arabic_calligraphy', number: '4.1', zoneId: 'zone_humanity', category: 'culture', name: ['دار الخط العربي', 'House of Arabic Calligraphy'], summary: ['فن الخط العربي من الماضي إلى اليوم.', 'Arabic calligraphy from past to present.'], activity: ['ورشة الخط', 'Calligraphy workshop', '16:30'], durationMin: 45, position: [398, 478] },
  { key: 'heritage_crafts', number: '4.2', zoneId: 'zone_humanity', category: 'culture', name: ['جناح الحرف السعودية', 'Saudi Crafts Pavilion'], summary: ['السدو والفخار والخوص بأيدي الحرفيين.', 'Sadu weaving, pottery and palm crafts by artisans.'], activity: ['عرض حي للحرفيين', 'Live artisan demo', '11:00'], durationMin: 40, position: [300, 411] },
  { key: 'future_medicine', number: '4.3', zoneId: 'zone_humanity', category: 'health', name: ['معرض طب المستقبل', 'Future Medicine Gallery'], summary: ['كيف تساعد التقنية الأطباء.', 'How technology helps doctors.'], activity: ['عرض الجراحة الروبوتية', 'Robotic-surgery demo', '14:30'], durationMin: 40, position: [282, 490] },
  { key: 'wellbeing', number: '4.4', zoneId: 'zone_humanity', category: 'health', name: ['جناح جودة الحياة', 'Wellbeing Pavilion'], summary: ['النوم والحركة والتغذية في تجربة واحدة.', 'Sleep, movement and nutrition in one experience.'], activity: ['جلسة استرخاء', 'Relaxation session', '12:00'], durationMin: 30, position: [366, 580] },
  { key: 'sports_science', number: '4.5', zoneId: 'zone_humanity', category: 'health', name: ['ساحة علوم الرياضة', 'Sports Science Arena'], summary: ['قِس سرعتك وتوازنك.', 'Measure your speed and balance.'], activity: ['تحدي اللياقة', 'Fitness challenge', '17:00'], durationMin: 30, position: [150, 433] },
  { key: 'family_corner', number: '4.6', zoneId: 'zone_humanity', category: 'health', name: ['ركن اكتشاف العائلة', 'Family Discovery Corner'], summary: ['ألعاب تعليمية للأطفال عن الصحة والعلوم.', 'Educational health and science games for children.'], activity: ['مسرح الأطفال', "Children's theatre", '10:00'], durationMin: 25, position: [215, 535] },
  // 5 · Central plaza
  { key: 'main_stage', number: '5.1', zoneId: 'zone_plaza', category: 'events', name: ['المسرح الرئيسي', 'Main Stage'], summary: ['عروض وفعاليات يومية في الساحة المركزية.', 'Daily shows and events on the central plaza.'], activity: ['عرض الافتتاح اليومي', 'Daily opening show', '18:00'], durationMin: 45, position: [500, 338] },
];

export const DEMO_BOOTHS: ExpoBooth[] = BOOTHS.map((s) => ({
  id: `booth_${s.key}`,
  zoneId: s.zoneId,
  number: s.number,
  name: tx(s.name[0], s.name[1]),
  category: s.category,
  summary: tx(s.summary[0], s.summary[1]),
  description: tx(`${s.summary[0]} (بيانات تجريبية توضيحية)`, `${s.summary[1]} (Illustrative demo data.)`),
  activities: [{ title: tx(s.activity[0], s.activity[1]), time: s.activity[2] }],
  suggestedDurationMin: s.durationMin,
  position: s.position,
  images: [CATEGORY_PHOTO[s.category]],
  provenance: 'demo',
}));

const facility = (id: string, number: string, zoneId: string, kind: ExpoFacilityKind, name: [string, string], position: [number, number]): ExpoFacility => ({
  id: `fac_${id}`,
  number,
  zoneId,
  kind,
  name: tx(name[0], name[1]),
  position,
});

export const DEMO_FACILITIES: ExpoFacility[] = [
  // 5 · Central plaza & gate (visitor services)
  facility('main_gate', '5.2', 'zone_plaza', 'entrance', ['البوابة الرئيسية', 'Main Gate'], [500, 627]),
  facility('welcome_center', '5.3', 'zone_plaza', 'info', ['مركز الترحيب والمعلومات', 'Welcome & Information Center'], [474, 571]),
  facility('transport_stop', '5.4', 'zone_plaza', 'transport', ['محطة النقل الترددي (توضيحية)', 'Shuttle stop (illustrative)'], [526, 533]),
  facility('food_court', '5.5', 'zone_plaza', 'food', ['ساحة المطاعم', 'Food Court'], [562, 308]),
  facility('coffee_house', '5.6', 'zone_plaza', 'food', ['بيت القهوة السعودية', 'Saudi Coffee House'], [438, 308]),
  facility('prayer_room', '5.7', 'zone_plaza', 'prayer', ['المصلى', 'Prayer Room'], [434, 372]),
  facility('restrooms', '5.8', 'zone_plaza', 'restroom', ['دورات المياه', 'Restrooms'], [566, 372]),
  facility('first_aid', '5.9', 'zone_plaza', 'firstaid', ['الإسعافات الأولية', 'First Aid'], [500, 400]),
];
