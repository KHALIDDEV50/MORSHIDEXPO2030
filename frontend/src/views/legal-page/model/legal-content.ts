import type { LocalizedText } from '@/shared/api';

/**
 * Privacy policy and terms of use — DRAFTS pending legal review (docs/public-site.md §6).
 *
 * Every statement about data handling was checked against the code on 2026-10-12 (development
 * branch, demo mode): localStorage keys in shared/api/demo.ts and the entity stores, the map
 * style URLs in shared/config/env.ts, the Web Speech providers in shared/lib/speech, the one-shot
 * location in features/locate-me, self-hosted fonts in app/fonts.ts, and the absence of
 * analytics, advertising or payment code. Anything that could not be confirmed from the code is
 * marked `review: 'legal' | 'technical'` and shown as such on the page.
 * Structured so it can move to a CMS; the legal reviewer should edit this file, not the UI.
 */
export type LegalBlock = { p: LocalizedText } | { list: LocalizedText[] };
export type LegalSection = { id: string; title: LocalizedText; blocks: LegalBlock[]; review?: 'legal' | 'technical' };
export type LegalDoc = { sections: LegalSection[] };

const tx = (ar: string, en: string): LocalizedText => ({ ar, en });
const p = (ar: string, en: string): LegalBlock => ({ p: tx(ar, en) });
const list = (...items: [string, string][]): LegalBlock => ({ list: items.map(([ar, en]) => tx(ar, en)) });

export const PRIVACY: LegalDoc = {
  sections: [
    {
      id: 'draft',
      title: tx('عن هذه المسودة', 'About this draft'),
      review: 'legal',
      blocks: [
        p(
          'تصف هذه الصفحة كيف يتعامل موقع مرشد التجريبي مع المعلومات، بناءً على فحص الشيفرة الحالية للنسخة التجريبية. هي مسودة لم تخضع لمراجعة قانونية بعد، ولا تدّعي الامتثال لأي قانون.',
          "This page describes how the MORSHID demo website handles information, based on an inspection of the demo's current code. It is a draft that has not been legally reviewed and does not claim compliance with any law.",
        ),
      ],
    },
    {
      id: 'controller',
      title: tx('الجهة المسؤولة', 'Who is responsible'),
      review: 'legal',
      blocks: [p('لم تُحدَّد بعد هوية الجهة المشغّلة لمرشد وبيانات التواصل معها. ستضاف قبل أي نشر للعموم.', 'The identity of the organisation operating MORSHID and its contact details have not been confirmed yet. They will be added before any public release.')],
    },
    {
      id: 'no-server',
      title: tx('لا يوجد خادم لمرشد في هذه النسخة', 'There is no MORSHID server in this demo'),
      blocks: [
        p(
          'تعمل النسخة التجريبية بالكامل في متصفحك. ما تكتبه أو تحفظه يُخزَّن في التخزين المحلي (localStorage) على جهازك، ولا يُرسَل إلى خادم تابع لمرشد.',
          'The demo runs entirely in your browser. What you type or save is kept in local storage (localStorage) on your device and is not sent to a MORSHID server.',
        ),
      ],
    },
    {
      id: 'stored',
      title: tx('ما الذي يُحفَظ في متصفحك', 'What is stored in your browser'),
      blocks: [
        list(
          ['محادثاتك مع عارف ورؤيا.', 'Your conversations with Arif and Roaya.'],
          ['الخطط التي تنشئها أو تحفظها.', 'The plans you create or save.'],
          ['الإشعارات التجريبية وتفضيلاتها.', 'Demo notifications and their preferences.'],
          ['ملف تجريبي: الاسم والبريد الإلكتروني اللذان تدخلهما عند تسجيل الدخول أو إنشاء حساب تجريبي. كلمة المرور يُتحقق من طولها فقط ولا تُحفَظ.', 'A demo profile: the name and email you enter when you sign in or create a demo account. The password is only checked for length and is not stored.'],
          ['الباقة والرصيد التجريبيان (محاكاة، دون أي دفع).', 'The demo plan and credits (simulated, no payment).'],
          ['تفضيلات العرض: الرفيق المختار، وحالة الشريط الجانبي، والمظهر الفاتح أو الداكن.', 'Display preferences: your chosen companion, the sidebar state, and light or dark appearance.'],
        ),
        p('قد تضع مكتبة الترجمة ملف تعريف ارتباط (NEXT_LOCALE) لتذكّر لغتك.', 'The localisation library may set a cookie (NEXT_LOCALE) to remember your language.'),
      ],
    },
    {
      id: 'cookie',
      title: tx('ملف تعريف ارتباط اللغة', 'The language cookie'),
      review: 'technical',
      blocks: [p('مدة بقاء ملف تعريف ارتباط اللغة وتوقيت إنشائه يحددهما إعداد المكتبة الافتراضي ويحتاجان إلى تأكيد تقني.', "How long the language cookie lasts and exactly when it is set follow the library's defaults and need technical confirmation.")],
    },
    {
      id: 'third-parties',
      title: tx('خدمات يتصل بها متصفحك', 'Services your browser contacts'),
      blocks: [
        list(
          ['الخرائط: عند عرض خريطة، يطلب متصفحك صور الخريطة من OpenFreeMap (tiles.openfreemap.org)، فيصل إليها عنوان IP الخاص بك ومنطقة الخريطة المطلوبة.', 'Maps: when a map is shown, your browser requests map tiles from OpenFreeMap (tiles.openfreemap.org), which receives your IP address and the map area requested.'],
          ['الصوت: يستخدم التعرف على الكلام واجهة Web Speech في متصفحك؛ في بعض المتصفحات يعالَج الصوت عبر خدمة الشركة المطوِّرة للمتصفح. مرشد لا يستقبل الصوت.', "Voice: speech recognition uses your browser's Web Speech API; in some browsers the audio is processed by the browser maker's online service. MORSHID does not receive the audio."],
          ['الروابط الخارجية (اتجاهات خرائط Google، وصفحات الصور في ويكيميديا كومنز، والمصادر المذكورة في المقالات) لا تُفتح إلا عندما تنقر عليها.', 'External links (Google Maps directions, Wikimedia Commons photo pages, sources cited in articles) only open when you click them.'],
          ['الخطوط تُقدَّم من هذا الموقع نفسه؛ لا يُطلب شيء من خدمات الخطوط أثناء التصفح.', 'Fonts are served from this website itself; nothing is requested from font services while browsing.'],
        ),
        p('تنطبق سياسات تلك الخدمات على ما تستقبله.', 'Those services’ own policies apply to what they receive.'),
      ],
    },
    {
      id: 'third-party-review',
      title: tx('دور مزودي الخدمة', 'The role of service providers'),
      review: 'legal',
      blocks: [p('لم يُقيَّم بعد الوضع القانوني لمزودي الخرائط والصوت (كمعالجين أو جهات مستقلة) ولا الحاجة إلى اتفاقيات معهم.', 'The legal status of the map and voice providers (as processors or independent parties) and any agreements needed with them have not been assessed.')],
    },
    {
      id: 'location',
      title: tx('الموقع الجغرافي', 'Location'),
      blocks: [
        p(
          'لا يُطلب موقعك إلا عندما تضغط «أين أنا؟»، فيعرض متصفحك طلب إذن. يُستخدم الموقع مرة واحدة داخل الصفحة لعرضه على الخريطة؛ لا يُتتبَّع في الخلفية، ولا يُحفَظ، ولا يُرسَل إلى خادم لمرشد، ولا يُستنتج منه وصولك إلى أي مكان.',
          'Your location is only requested when you press "Where am I?", and your browser asks for permission. It is used once, inside the page, to show it on the map; it is not tracked in the background, not stored, not sent to a MORSHID server, and never used to assume you have arrived somewhere.',
        ),
      ],
    },
    {
      id: 'assistant',
      title: tx('ردود المساعد', 'Assistant replies'),
      blocks: [
        p(
          'في هذه النسخة تُعَدّ الردود داخل متصفحك من بيانات الدليل؛ لا يستقبل أي مزود ذكاء اصطناعي رسائلك.',
          'In this demo, replies are prepared inside your browser from the guide data; no AI provider receives your messages.',
        ),
      ],
    },
    {
      id: 'assistant-future',
      title: tx('عند ربط خدمة ذكاء اصطناعي حقيقية', 'When a real AI service is connected'),
      review: 'technical',
      blocks: [p('ربط خادم أو مزود ذكاء اصطناعي سيغيّر ما يُرسَل ويُحفَظ، ويتطلب إعادة كتابة هذه الصفحة قبل التشغيل.', 'Connecting a server or AI provider will change what is sent and stored, and requires this page to be rewritten before launch.')],
    },
    {
      id: 'not-done',
      title: tx('ما لا تفعله النسخة التجريبية', 'What the demo does not do'),
      blocks: [
        list(
          ['لا أدوات تحليلات أو إعلانات أو ملفات تعريف ارتباط للتتبع.', 'No analytics, advertising or tracking cookies.'],
          ['لا مدفوعات ولا بيانات بطاقات؛ الباقات والرصيد محاكاة.', 'No payments and no card data; plans and credits are simulated.'],
          ['لا رسائل بريد إلكتروني؛ إعادة تعيين كلمة المرور محاكاة.', 'No emails; password reset is simulated.'],
          ['لا قائمة اشتراك لإطلاق التطبيق.', 'No sign-up list for the app launch.'],
        ),
      ],
    },
    {
      id: 'control',
      title: tx('تحكّمك في بياناتك', 'Your control'),
      blocks: [
        p(
          'لحذف كل ما حفظته، امسح بيانات هذا الموقع من إعدادات متصفحك. تسجيل الخروج يعيدك إلى وضع الزائر لكنه لا يمسح البيانات المحفوظة. التصفح الخاص لا يحتفظ بها بعد إغلاق النافذة.',
          "To delete everything you saved, clear this site's data in your browser settings. Signing out returns you to guest mode but does not erase stored data. Private browsing does not keep it after the window closes.",
        ),
      ],
    },
    {
      id: 'rights',
      title: tx('حقوقك والأساس النظامي', 'Your rights and the legal basis'),
      review: 'legal',
      blocks: [p('لم يُقيَّم بعد القانون المنطبق (مثل نظام حماية البيانات الشخصية في المملكة العربية السعودية) ولا الحقوق التي يمنحها ولا أساس المعالجة.', 'The applicable law (for example Saudi Arabia’s Personal Data Protection Law), the rights it grants and the legal basis for processing have not been assessed yet.')],
    },
    {
      id: 'children',
      title: tx('الأطفال', 'Children'),
      review: 'legal',
      blocks: [p('لم تُحدَّد بعد سياسة استخدام الأطفال للخدمة.', 'A policy on use of the service by children has not been determined.')],
    },
    {
      id: 'changes',
      title: tx('التغييرات والتواصل', 'Changes and contact'),
      review: 'legal',
      blocks: [p('ستُحدَّث هذه الصفحة عند تغيّر الخدمة. ستضاف وسيلة تواصل بعد تأكيد الجهة المسؤولة.', 'This page will be updated when the service changes. A contact channel will be added once the responsible organisation is confirmed.')],
    },
  ],
};

export const TERMS: LegalDoc = {
  sections: [
    {
      id: 'draft',
      title: tx('عن هذه المسودة', 'About this draft'),
      review: 'legal',
      blocks: [p('هذه شروط استخدام مبدئية لنسخة تجريبية، لم تخضع لمراجعة قانونية بعد.', 'These are preliminary terms of use for a demo, not yet legally reviewed.')],
    },
    {
      id: 'service',
      title: tx('ما هو مرشد', 'What MORSHID is'),
      blocks: [
        p(
          'مرشد نسخة تجريبية من رفيق سياحي بالذكاء الاصطناعي للرياض والمملكة العربية السعودية وإكسبو 2030. بعض الميزات محاكاة — ردود المساعد، والحسابات، والإشعارات، ومخطط إكسبو — وكلها موسومة بذلك.',
          'MORSHID is a demo of an AI tourism companion for Riyadh, Saudi Arabia and Expo 2030. Some features are simulated — assistant replies, accounts, notifications and the Expo layout — and are labelled as such.',
        ),
      ],
    },
    {
      id: 'accuracy',
      title: tx('دقة المعلومات', 'Accuracy of information'),
      blocks: [
        list(
          ['معلومات الوجهات عامة ولأغراض الإلهام والتخطيط.', 'Destination information is general and meant for inspiration and planning.'],
          ['مواعيد العمل في النسخة التجريبية بيانات توضيحية؛ تحقق دائمًا من المصادر الرسمية.', 'Opening hours in the demo are illustrative; always check official sources.'],
          ['مرشد لا يبيع تذاكر ولا يحجز ولا يعرض أسعارًا.', 'MORSHID does not sell tickets, make bookings or show prices.'],
        ),
      ],
    },
    {
      id: 'assistant',
      title: tx('ردود المساعد', 'Assistant replies'),
      blocks: [p('الردود مُعدّة من بيانات الدليل وقد تكون ناقصة. ليست نصيحة مهنية، والقرار في خططك لك دائمًا.', 'Replies are prepared from the guide data and may be incomplete. They are not professional advice, and decisions about your plans are always yours.')],
    },
    {
      id: 'expo',
      title: tx('محتوى إكسبو 2030', 'Expo 2030 content'),
      blocks: [
        p(
          'مخطط إكسبو وأجنحته ومواعيده في مرشد توضيحية، وصوره صور موضوعية أو تصوّرات تصميمية للموقع المستقبلي. مرشد مشروع مستقل غير تابع لإكسبو 2030 الرياض ولا للمكتب الدولي للمعارض، ولا يحظى بتأييدهما.',
          'The Expo layout, pavilions and times in MORSHID are illustrative, and its images are theme photos or concept renderings of the future site. MORSHID is an independent project, not affiliated with or endorsed by Expo 2030 Riyadh or the Bureau International des Expositions.',
        ),
      ],
    },
    {
      id: 'accounts',
      title: tx('الحسابات التجريبية', 'Demo accounts'),
      blocks: [
        p(
          'الحسابات في هذه النسخة ليست حسابات حقيقية ولا توفر حماية أمنية. تبقى البيانات في متصفحك ويستطيع رؤيتها كل من يستخدم الجهاز نفسه؛ لا تُدخل معلومات حساسة.',
          'Accounts in this demo are not real accounts and provide no security. Data stays in your browser and anyone using the same device can see it; do not enter sensitive information.',
        ),
      ],
    },
    {
      id: 'use',
      title: tx('الاستخدام المقبول', 'Acceptable use'),
      blocks: [list(['لا تُدخل بيانات شخصية لأشخاص آخرين.', "Don't enter other people's personal data."], ['لا تحاول تعطيل الخدمة أو إساءة استخدامها.', "Don't try to disrupt or misuse the service."], ['التزم بالأنظمة المحلية والإرشادات الرسمية أثناء السفر.', 'Follow local laws and official guidance while travelling.'])],
    },
    {
      id: 'content',
      title: tx('المحتوى والتراخيص', 'Content and licences'),
      blocks: [
        p(
          'صور الوجهات من مساهمي ويكيميديا كومنز بتراخيص حرة، ويُذكر المؤلف والترخيص مع كل صورة. مقالات المجلة محتوى نموذجي كُتب لهذه النسخة.',
          'Destination photos come from Wikimedia Commons contributors under free licences, with the author and licence shown with each photo. Journal articles are sample content written for this demo.',
        ),
      ],
    },
    {
      id: 'ownership',
      title: tx('ملكية الاسم والشخصيات', 'Ownership of the name and characters'),
      review: 'legal',
      blocks: [p('ملكية اسم مرشد وشخصيتي عارف ورؤيا والتصميم تحتاج إلى تأكيد قانوني.', 'Ownership of the MORSHID name, the Arif and Roaya characters and the design needs legal confirmation.')],
    },
    {
      id: 'liability',
      title: tx('الضمان والمسؤولية', 'Warranty and liability'),
      review: 'legal',
      blocks: [p('تُقدَّم النسخة التجريبية كما هي. صياغة إخلاء الضمان وحدود المسؤولية تحتاج إلى مراجعة قانونية.', 'The demo is provided as is. The wording of warranty disclaimers and liability limits needs legal review.')],
    },
    {
      id: 'law',
      title: tx('القانون الحاكم', 'Governing law'),
      review: 'legal',
      blocks: [p('لم يُحدَّد بعد.', 'Not yet determined.')],
    },
    {
      id: 'changes',
      title: tx('التغييرات والتواصل', 'Changes and contact'),
      review: 'legal',
      blocks: [p('قد تتغير هذه الشروط مع تطور الخدمة. ستضاف وسيلة تواصل بعد تأكيد الجهة المسؤولة.', 'These terms may change as the service develops. A contact channel will be added once the responsible organisation is confirmed.')],
    },
  ],
};
