import type { Article } from '../../model/article';

/**
 * Travel Journal — SAMPLE articles written for the MORSHID demo (status 'sample').
 * No publication dates, bylines, interviews or quotes are invented. Facts are general public
 * knowledge and the specific ones (UNESCO inscription years, Expo 2030 dates and theme) cite
 * their public sources. Opening hours and prices are deliberately never stated.
 */
const tx = (ar: string, en: string) => ({ ar, en });
const p = (ar: string, en: string) => ({ type: 'p' as const, text: tx(ar, en) });
const h2 = (id: string, ar: string, en: string) => ({ type: 'h2' as const, id, text: tx(ar, en) });
const tip = (ar: string, en: string) => ({ type: 'tip' as const, text: tx(ar, en) });
const list = (items: [string, string][], ordered = false) => ({ type: 'list' as const, ordered, items: items.map(([ar, en]) => tx(ar, en)) });
const places = (...placeIds: string[]) => ({ type: 'places' as const, placeIds });

const UNESCO = {
  hegra: { label: 'UNESCO World Heritage List — Al-Hijr Archaeological Site (Madâin Sâlih)', url: 'https://whc.unesco.org/en/list/1293' },
  turaif: { label: "UNESCO World Heritage List — At-Turaif District in ad-Dir'iyah", url: 'https://whc.unesco.org/en/list/1329' },
  jeddah: { label: 'UNESCO World Heritage List — Historic Jeddah, the Gate to Makkah', url: 'https://whc.unesco.org/en/list/1361' },
  ahsa: { label: 'UNESCO World Heritage List — Al-Ahsa Oasis, an Evolving Cultural Landscape', url: 'https://whc.unesco.org/en/list/1563' },
};
const BIE = { label: 'Bureau International des Expositions (BIE)', url: 'https://www.bie-paris.org/' };

export const SAMPLE_ARTICLES: Article[] = [
  {
    slug: 'historic-riyadh-first-morning',
    category: 'riyadh',
    title: tx('صباحك الأول في الرياض التاريخية', 'A first morning in historic Riyadh'),
    excerpt: tx(
      'ابدأ من حيث بدأت المدينة الحديثة: قصر المصمك وأزقة الديرة وقصر المربع — مسار يُمشى في صباح لطيف.',
      'Start where the modern city began: Masmak Fortress, the lanes of Al-Dirah and Murabba Palace — a route for a cool morning.',
    ),
    cover: 'masmak',
    featured: true,
    status: 'sample',
    publishedAt: null,
    body: [
      p(
        'وسط الرياض القديم صغير بما يكفي لاكتشافه في صباح واحد. يربط هذا المسار ثلاثة أماكن من دليل مرشد بالترتيب الأسهل لمعظم الزوار، ويبدأ مبكرًا حين يكون الجو ألطف.',
        "Riyadh's old centre is compact enough to explore in a single morning. This route links three places from MORSHID's guide in the order most visitors find easiest, starting early while it is cooler.",
      ),
      h2('masmak', 'قصر المصمك', 'Masmak Fortress'),
      p(
        'حصن من الطين واللبن في حي الديرة، تحوّل اليوم إلى متحف. يرتبط اسمه باستعادة الملك عبدالعزيز للرياض عام 1902، الحدث الذي افتتح قصة الدولة السعودية الحديثة. تمهّل عند البوابة الخشبية الثقيلة وفي الأفنية الداخلية؛ فالمكان يُفهم بالمشي البطيء.',
        "A clay and mud-brick fort in the Al-Dirah district, today a museum. Its name is tied to King Abdulaziz's recapture of Riyadh in 1902 — the event that opened the story of the modern Saudi state. Take your time at the heavy wooden gate and in the inner courtyards; the place is best understood slowly.",
      ),
      h2('souq', 'سوق الزل', 'Souq Al-Zal'),
      p(
        'على بُعد خطوات من المصمك يقع سوق الزل، أحد أقدم أسواق الرياض. تجد فيه السجاد والبخور والملابس التقليدية والتحف. إن أردت شراء شيء فاسأل عن مصدره وخذ وقتك في المقارنة.',
        "A short walk from Masmak, Souq Al-Zal is one of Riyadh's oldest markets: carpets, incense, traditional clothing and antiques. If you want to buy something, ask about where it comes from and take your time comparing.",
      ),
      h2('murabba', 'قصر المربع', 'Murabba Palace'),
      p(
        'بناه الملك عبدالعزيز في أواخر ثلاثينيات القرن العشرين خارج أسوار المدينة القديمة، وهو اليوم جزء من مركز الملك عبدالعزيز التاريخي بجوار المتحف الوطني السعودي. إن بقي لديك وقت، فالمتحف الوطني خاتمة مناسبة لصباحك.',
        'King Abdulaziz built it in the late 1930s outside the walls of the old city; today it is part of the King Abdulaziz Historical Center, next to the National Museum of Saudi Arabia. If you have time left, the museum is a fitting end to the morning.',
      ),
      places('plc_masmak', 'plc_souq_zal', 'plc_murabba', 'plc_national_museum'),
      tip(
        'مواعيد العمل تتغير، خاصة في رمضان والإجازات. تحقق منها من المصادر الرسمية قبل الزيارة — المواعيد في نسخة مرشد التجريبية بيانات توضيحية.',
        "Opening hours change, especially during Ramadan and holidays. Check official sources before you go — hours in MORSHID's demo are illustrative data.",
      ),
      p(
        'جرّب أن تطلب من عارف: «خطط لصباح تراثي في الرياض». سيقترح مسارًا مشابهًا تستطيع تعديله وحفظه في خططي.',
        'Try asking Arif: "Plan a heritage morning in Riyadh." He will propose a similar route you can edit and save to My Plans.',
      ),
    ],
    relatedPlaceIds: ['plc_masmak', 'plc_souq_zal', 'plc_murabba', 'plc_national_museum'],
    sources: [],
  },
  {
    slug: 'at-turaif-first-saudi-capital',
    category: 'heritage',
    title: tx('الطريف: نزهة في عاصمة الدولة السعودية الأولى', 'At-Turaif: a walk through the first Saudi capital'),
    excerpt: tx(
      'جدران الطين والأزقة الظليلة في الدرعية — ولماذا أُدرج حي الطريف في قائمة التراث العالمي.',
      "Mud-brick walls and shaded lanes in Diriyah — and why At-Turaif is on UNESCO's World Heritage List.",
    ),
    cover: 'turaif',
    featured: false,
    status: 'sample',
    publishedAt: null,
    body: [
      p(
        'على الطرف الشمالي الغربي من الرياض تقع الدرعية، مقر الدولة السعودية الأولى في القرن الثامن عشر. وحي الطريف هو قلبها المبني بالطين، وقد أُدرج في قائمة اليونسكو للتراث العالمي عام 2010.',
        "On the north-western edge of Riyadh lies Diriyah, seat of the first Saudi state in the 18th century. At-Turaif is its mud-brick heart, inscribed on UNESCO's World Heritage List in 2010.",
      ),
      h2('see', 'ماذا سترى', "What you'll see"),
      list([
        ['جدران سميكة من اللبن تحافظ على برودة الداخل.', 'Thick mud-brick walls that keep interiors cool.'],
        ['أزقة ضيقة ظليلة صُممت لتقليل حرارة الشمس.', 'Narrow, shaded lanes designed against the sun.'],
        ['زخارف وفتحات مثلثة من سمات العمارة النجدية.', 'Decorative triangular openings typical of Najdi architecture.'],
      ]),
      h2('bujairi', 'على الضفة الأخرى: البجيري', 'Across the wadi: Al-Bujairi'),
      p(
        'يقابل حيّ البجيري حيَّ الطريف عبر وادي حنيفة، ويضم مطاعم ومقاهي بإطلالة على الأسوار. خطة شائعة: جولة في الطريف ثم استراحة في البجيري.',
        'Al-Bujairi faces At-Turaif across Wadi Hanifah, with restaurants and cafés looking onto the walls. A popular plan: walk At-Turaif, then rest at Al-Bujairi.',
      ),
      places('plc_turaif', 'plc_bujairi'),
      tip(
        'نظام الدخول والتذاكر قد يتغير. تحقق من القنوات الرسمية للدرعية قبل زيارتك؛ مرشد لا يبيع التذاكر.',
        "Access and ticketing can change. Check Diriyah's official channels before your visit; MORSHID does not sell tickets.",
      ),
      h2('plan', 'خطط لها مع مرشد', 'Plan it with MORSHID'),
      list(
        [
          ['اسأل عارف عن تاريخ الدرعية وما تبحث عنه هناك.', 'Ask Arif about the history of Diriyah and what to look for.'],
          ['أضف الطريف والبجيري إلى خطة يوم واحد.', 'Add At-Turaif and Al-Bujairi to a one-day plan.'],
          ['افتح الخطة على الخريطة لترى المسافة بين المحطات.', 'Open the plan on the map to see the distance between stops.'],
        ],
        true,
      ),
    ],
    relatedPlaceIds: ['plc_turaif', 'plc_bujairi', 'plc_masmak'],
    sources: [UNESCO.turaif],
  },
  {
    slug: 'unesco-sites-in-morshid',
    category: 'saudi',
    title: tx('أربعة مواقع تراث عالمي تستكشفها في مرشد', 'Four UNESCO World Heritage sites to explore in MORSHID'),
    excerpt: tx(
      'من مقابر الأنباط في الحجر إلى واحة الأحساء: لمحة عن أربعة مواقع سعودية مدرجة في قائمة اليونسكو.',
      'From the Nabataean tombs of Hegra to the Al-Ahsa Oasis: four Saudi sites on the UNESCO World Heritage List.',
    ),
    cover: 'hegra',
    featured: true,
    status: 'sample',
    publishedAt: null,
    body: [
      p(
        'لدى المملكة العربية السعودية عدة مواقع في قائمة التراث العالمي لليونسكو، أربعة منها موجودة اليوم في دليل مرشد. سنوات الإدراج أدناه من قائمة اليونسكو الرسمية.',
        "Saudi Arabia has several sites on UNESCO's World Heritage List, and four of them are in MORSHID's guide today. The inscription years below come from the official UNESCO list.",
      ),
      h2('hegra', 'الحجر (مدائن صالح) — العُلا، 2008', 'Hegra (Al-Hijr) — AlUla, 2008'),
      p(
        'أول موقع سعودي في القائمة. مدينة نبطية تشتهر بمقابرها الضخمة المنحوتة في الصخور الرملية، وتصفها اليونسكو بأنها أكبر موقع محفوظ لحضارة الأنباط جنوب البتراء.',
        "The Kingdom's first site on the list: a Nabataean city famous for monumental tombs carved into sandstone outcrops, described by UNESCO as the largest conserved site of the Nabataean civilisation south of Petra.",
      ),
      h2('turaif', 'حي الطريف — الدرعية، 2010', "At-Turaif — Diriyah, 2010"),
      p(
        'مقر الدولة السعودية الأولى، ومثال بارز على العمارة النجدية المبنية بالطين.',
        'Seat of the first Saudi state and an outstanding example of Najdi mud-brick architecture.',
      ),
      h2('jeddah', 'جدة التاريخية، بوابة مكة — 2014', 'Historic Jeddah, the Gate to Makkah — 2014'),
      p(
        'بيوت برجية من الحجر المرجاني ورواشين خشبية، في مدينة كانت تاريخيًا ميناء الحجاج القادمين بحرًا.',
        'Coral-stone tower houses with wooden rawasheen, in a city that was historically the port for pilgrims arriving by sea.',
      ),
      h2('ahsa', 'واحة الأحساء — 2018', 'Al-Ahsa Oasis — 2018'),
      p(
        'من أكبر الواحات في العالم، بمزارع نخيل وعيون وقنوات. وفي محيطها جبل القارة بكهوفه الكلسية التي تبقى باردة نسبيًا.',
        "One of the largest oases in the world, with palm groves, springs and canals. Nearby, Al-Qarah Mountain's limestone caves stay relatively cool.",
      ),
      places('plc_hegra', 'plc_turaif', 'plc_historic_jeddah', 'plc_al_qarah'),
      tip(
        'ظروف الزيارة تختلف من موقع لآخر، وبعضها يتطلب حجزًا مسبقًا. تحقق من الجهات الرسمية لكل موقع.',
        'Visiting conditions differ by site and some require booking in advance. Check each site’s official channels.',
      ),
    ],
    relatedPlaceIds: ['plc_hegra', 'plc_turaif', 'plc_historic_jeddah', 'plc_al_qarah'],
    sources: [UNESCO.hegra, UNESCO.turaif, UNESCO.jeddah, UNESCO.ahsa],
  },
  {
    slug: 'preparing-for-expo-2030-riyadh',
    category: 'expo',
    title: tx('الاستعداد لإكسبو 2030 الرياض: ما نعرفه حتى الآن', 'Preparing for Expo 2030 Riyadh: what we know so far'),
    excerpt: tx(
      'المواعيد والشعار المعلنان، وما لا يعرفه مرشد بعد — وكيف تستخدم المعاينة التوضيحية للتخطيط.',
      "The announced dates and theme, what MORSHID doesn't know yet — and how to use the illustrative preview to plan.",
    ),
    cover: 'expoTowerDusk',
    featured: true,
    status: 'sample',
    publishedAt: null,
    body: [
      p(
        'في نوفمبر 2023 اختارت الدول الأعضاء في المكتب الدولي للمعارض (BIE) مدينة الرياض لاستضافة معرض إكسبو الدولي 2030، المقرر من 1 أكتوبر 2030 إلى 31 مارس 2031 تحت شعار «حقبة التغيير: معًا نستشرف المستقبل».',
        'In November 2023 the member states of the Bureau International des Expositions (BIE) chose Riyadh to host World Expo 2030, scheduled from 1 October 2030 to 31 March 2031 under the theme "The Era of Change: Together for a Foresighted Tomorrow".',
      ),
      p(
        'معارض إكسبو الدولية المسجلة قد تستمر حتى ستة أشهر، وتجمع أجنحة الدول والمنظمات حول موضوع واحد.',
        'Registered World Expos can last up to six months and bring together pavilions from countries and organisations around one theme.',
      ),
      h2('unknown', 'ما لا يعرفه مرشد', "What MORSHID doesn't know"),
      p(
        'مرشد لا يملك بيانات رسمية عن إكسبو 2030. مخطط الموقع النهائي والأجنحة ومواعيد العمل والتذاكر يجب أخذها من القنوات الرسمية لإكسبو 2030 الرياض فقط.',
        'MORSHID has no official Expo 2030 data. The final site plan, pavilions, opening hours and tickets should be taken only from the official Expo 2030 Riyadh channels.',
      ),
      h2('preview', 'ما هي معاينة إكسبو في مرشد؟', "What is MORSHID's Expo preview?"),
      p(
        'مخطط توضيحي يُظهر كيف يمكن أن يعمل التخطيط: أربع مناطق موضوعية — الأرض والتعاون والتقنيات والإنسانيات — حول ساحة مركزية، وأجنحة نموذجية بصور توضيحية، وخطة زيارة تبنيها مع رؤيا. ليست المخطط الرسمي، وكل شاشة فيها تقول ذلك.',
        'An illustrative layout showing how planning could work: four themed districts — Earth, Collaboration, Technology and Humanity — around a central plaza, sample pavilions with illustrative images, and a visit plan you build with Roaya. It is not the official plan, and every screen says so.',
      ),
      h2('ready', 'استعد من الآن', 'Getting ready now'),
      list([
        ['فترة المعرض تقع في الأشهر الألطف جوًا في الرياض؛ فكّر في دمج زيارتك مع معالم المدينة.', "The Expo period falls in Riyadh's milder months — consider combining your visit with the city's landmarks."],
        ['تابع الإعلانات الرسمية للمواعيد والتذاكر والوصول.', 'Follow official announcements for schedules, tickets and access.'],
        ['جرّب نصف يوم مع رؤيا في المعاينة لترى كيف تُرتب المحطات والأوقات.', 'Try a half-day with Roaya in the preview to see how stops and timing fit together.'],
      ]),
      tip(
        'الصورة أعلى المقال تصوّر تصميمي للموقع المستقبلي — وليست صورة فوتوغرافية لإكسبو 2030 الرياض الذي لم يُبنَ بعد، ولا المخطط الرسمي.',
        'The image above is a concept rendering of the future site — not a photograph of Expo 2030 Riyadh, which has not been built yet, and not the official plan.',
      ),
    ],
    relatedPlaceIds: ['plc_kafd', 'plc_national_museum'],
    sources: [BIE],
  },
  {
    slug: 'planning-around-riyadh-climate',
    category: 'tips',
    title: tx('خطط يومك وفق مناخ الرياض', "Planning your day around Riyadh's climate"),
    excerpt: tx(
      'متى تخرج، وكم محطة تكفي، وما الذي تتحقق منه قبل أن تبدأ — نصائح عملية ليوم مريح.',
      'When to head out, how many stops are enough and what to check first — practical advice for a comfortable day.',
    ),
    cover: 'kafd',
    featured: false,
    status: 'sample',
    publishedAt: null,
    body: [
      p(
        'مناخ الرياض صحراوي: صيف شديد الحرارة وشتاء معتدل. يجد معظم الزوار الأشهر الأبرد — تقريبًا من نوفمبر إلى فبراير — الأنسب للتنقل بين المعالم مشيًا.',
        'Riyadh has a desert climate: very hot summers and mild winters. Most visitors find the cooler months — roughly November to February — the most comfortable for walking between sights.',
      ),
      h2('shape', 'رتّب يومك حسب الحرارة', 'Shape the day around the heat'),
      list([
        ['المواقع التراثية المفتوحة في الصباح الباكر.', 'Open-air heritage sites in the early morning.'],
        ['المتاحف والأماكن المغلقة وقت الظهيرة.', 'Museums and indoor places around midday.'],
        ['الحدائق والإطلالات في آخر النهار والمساء.', 'Parks and viewpoints in the late afternoon and evening.'],
      ]),
      h2('pace', 'لا تزدحم خطتك', "Don't overload the plan"),
      p(
        'المسافات في الرياض كبيرة. خطة واقعية تضم ثلاث إلى خمس محطات في اليوم، مجمّعة حسب المنطقة: الوسط التاريخي، أو الدرعية، أو أحياء الشمال الحديثة.',
        'Distances in Riyadh are large. A realistic plan has three to five stops a day, grouped by area: the historic centre, Diriyah, or the modern northern districts.',
      ),
      places('plc_national_museum', 'plc_kingdom_centre', 'plc_salam_park'),
      h2('checks', 'قبل أن تخرج', 'Before you go'),
      list([
        ['تتغير مواعيد العمل كثيرًا في رمضان والإجازات الرسمية؛ تحقق منها.', 'Opening hours often change during Ramadan and public holidays — check them.'],
        ['احمل ماءً كافيًا واحمِ نفسك من الشمس.', 'Carry enough water and protect yourself from the sun.'],
        ['ارتدِ ملابس مريحة ومحتشمة تناسب المواقع التي تزورها.', 'Wear comfortable, modest clothing suited to the places you visit.'],
      ]),
      tip(
        'في وضع الإرشاد، أنت من يعلّم المحطة كمكتملة. مرشد لا يتتبع موقعك ولا يفترض أنك وصلت.',
        "In guided mode you mark each stop as done yourself. MORSHID doesn't track your location or assume you've arrived.",
      ),
    ],
    relatedPlaceIds: ['plc_national_museum', 'plc_kingdom_centre', 'plc_salam_park', 'plc_edge_world'],
    sources: [],
  },
  {
    slug: 'beyond-the-capital',
    category: 'saudi',
    title: tx('ما بعد العاصمة: العُلا وعسير والأحساء وجدة', 'Beyond the capital: AlUla, Asir, Al-Ahsa and Jeddah'),
    excerpt: tx(
      'صخور العُلا، وقرى عسير الحجرية، وواحة الأحساء، وجدة على البحر الأحمر — رحلات تستحق تخطيطًا خاصًا.',
      "AlUla's rocks, Asir's stone villages, the Al-Ahsa oasis and Jeddah on the Red Sea — trips worth planning on their own.",
    ),
    cover: 'elephantRock',
    featured: false,
    status: 'sample',
    publishedAt: null,
    body: [
      p(
        'المملكة واسعة، ومعظم هذه الوجهات بعيدة عن الرياض، لذلك يصل إليها الزوار عادة برحلة طيران داخلية ويخططون لها كرحلة مستقلة.',
        'Saudi Arabia is vast and most of these destinations are far from Riyadh, so visitors usually reach them by domestic flight and plan each as a separate trip.',
      ),
      h2('alula', 'العُلا', 'AlUla'),
      p(
        'في شمال غرب المملكة، مناظر من الصخور الرملية المنحوتة بفعل الطبيعة، أشهرها جبل الفيل. وعلى مقربة منها الحجر، أول موقع سعودي في قائمة التراث العالمي.',
        'In the north-west, landscapes of wind-sculpted sandstone, the best known being Elephant Rock. Nearby is Hegra, the first Saudi site on the World Heritage List.',
      ),
      h2('asir', 'عسير', 'Asir'),
      p(
        'في المرتفعات الجنوبية الغربية: قرية رجال ألمع ببيوتها الحجرية متعددة الطوابق، والسودة بمناخها الأبرد وجبالها الخضراء.',
        'In the south-western highlands: Rijal Almaa with its multi-storey stone houses, and Al-Soudah with its cooler climate and green mountains.',
      ),
      h2('ahsa', 'الأحساء', 'Al-Ahsa'),
      p(
        'واحة شاسعة من النخيل في المنطقة الشرقية، وفيها جبل القارة بكهوفه الكلسية.',
        'A vast palm oasis in the Eastern Province, home to Al-Qarah Mountain and its limestone caves.',
      ),
      h2('jeddah', 'جدة', 'Jeddah'),
      p(
        'على ساحل البحر الأحمر: جدة التاريخية بأزقتها وبيوتها المرجانية، ونافورة الملك فهد التي تُعد من أعلى النوافير في العالم.',
        "On the Red Sea coast: Historic Jeddah's lanes and coral-stone houses, and King Fahd's Fountain, one of the tallest fountains in the world.",
      ),
      places('plc_elephant_rock', 'plc_hegra', 'plc_rijal_almaa', 'plc_soudah', 'plc_al_qarah', 'plc_historic_jeddah', 'plc_king_fahd_fountain'),
      tip(
        'في صفحة اكتشف اختر «خارج الرياض» لترى هذه الوجهات على الخريطة الحقيقية.',
        'In Discover, choose "Outside Riyadh" to see these destinations on the real map.',
      ),
    ],
    relatedPlaceIds: ['plc_elephant_rock', 'plc_rijal_almaa', 'plc_al_qarah', 'plc_historic_jeddah'],
    sources: [UNESCO.hegra],
  },
  {
    slug: 'from-idea-to-day-plan',
    category: 'morshid',
    title: tx('من فكرة غامضة إلى خطة يوم: كيف يعمل مرشد', 'From a vague idea to a day plan: how MORSHID works'),
    excerpt: tx(
      'ماذا يحدث حين تقول «أريد يومًا هادئًا مع العائلة» — ومن يقرر ما يُحفظ في خطتك.',
      'What happens when you say "I want a calm family day" — and who decides what gets saved to your plan.',
    ),
    cover: 'salamPark',
    featured: false,
    status: 'sample',
    publishedAt: null,
    body: [
      p(
        'لا تحتاج إلى معرفة أسماء الأماكن لتبدأ. صف ما تحبه — التراث، الطعام، وقت قصير، أطفال معك — واختر رفيقك: عارف للحكايات والتراث، أو رؤيا للتخطيط الهادئ وإكسبو.',
        "You don't need to know place names to begin. Describe what you like — heritage, food, a short visit, children with you — and pick a companion: Arif for stories and heritage, or Roaya for calm planning and Expo.",
      ),
      h2('steps', 'خمس خطوات', 'Five steps'),
      list(
        [
          ['تصف ما تريده بكلماتك.', 'You describe what you want in your own words.'],
          ['يقترح الرفيق أماكن مع أسباب الاختيار.', 'Your companion suggests places with reasons.'],
          ['تراجع مقترح الخطة: تحذف وتعيد الترتيب قبل الحفظ.', 'You review the proposal: remove and reorder before saving.'],
          ['تفتح المحطات على الخريطة.', 'You open the stops on the map.'],
          ['تتابع الخطة محطة بمحطة وتعلّم ما أنجزته بنفسك.', 'You follow the plan stop by stop and mark progress yourself.'],
        ],
        true,
      ),
      h2('honest', 'ما هو حقيقي اليوم', "What's real today"),
      p(
        'هذه نسخة تجريبية: الردود مُعدة من بيانات الدليل وليست خدمة ذكاء اصطناعي حية بعد، والحسابات والإشعارات محاكاة، وبياناتك تبقى في متصفحك. الخرائط ومواقع الأماكن حقيقية.',
        'This is a demo: replies are prepared from the guide data, not a live AI service yet; accounts and notifications are simulated; your data stays in your browser. The maps and place locations are real.',
      ),
      tip('ابدأ من «جرّب العرض التجريبي» — لا حاجة لإنشاء حساب.', 'Start from "Try the demo" — no account needed.'),
    ],
    relatedPlaceIds: ['plc_salam_park', 'plc_king_abdullah_park', 'plc_national_museum'],
    sources: [],
  },
];
