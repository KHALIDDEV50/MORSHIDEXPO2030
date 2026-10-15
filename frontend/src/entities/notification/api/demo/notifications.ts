import type { AppNotification, NotificationPrefs } from '../../model/notification';

/** DEMO notifications (docs/demo-data.md §2): all 4 kinds, 3 unread. Generated in-app only. */
const tx = (ar: string, en: string) => ({ ar, en });
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export function seedNotifications(): { items: AppNotification[]; prefs: NotificationPrefs } {
  return {
    items: [
      { id: 'ntf_next_stop', kind: 'reminder', title: tx('محطتك التالية', 'Your next stop'), body: tx('قصر المربع في خطة «يوم في الرياض القديمة».', 'Murabba Palace is next in "Old Riyadh in one day".'), link: '/plans/plan_heritage_day', read: false, createdAt: hoursAgo(1) },
      { id: 'ntf_plan_saved', kind: 'plan_update', title: tx('تم حفظ الخطة', 'Plan saved'), body: tx('حُفظ اقتراح عارف في «خططي».', "Arif's proposal was saved to My Plans."), link: '/plans/plan_heritage_day', read: false, createdAt: hoursAgo(3) },
      { id: 'ntf_sunset_turaif', kind: 'recommendation', title: tx('اقتراح للمساء', 'Evening idea'), body: tx('حي الطريف أجمل قبيل الغروب.', 'At-Turaif is at its best before sunset.'), link: '/discover/plc_turaif', read: false, createdAt: hoursAgo(5) },
      { id: 'ntf_expo_reminder', kind: 'reminder', title: tx('خطة إكسبو قادمة', 'Upcoming Expo plan'), body: tx('خطتك «نصف يوم في إكسبو» بعد 10 أيام (بيانات تجريبية).', 'Your Expo half-day is in 10 days (demo data).'), link: '/plans/plan_expo_ai', read: true, createdAt: hoursAgo(26) },
      { id: 'ntf_demo_welcome', kind: 'announcement', title: tx('مرحبًا بك في مرشد', 'Welcome to MORSHID'), body: tx('هذه نسخة تجريبية: البيانات والردود محاكاة.', 'This is a demo: data and replies are simulated.'), read: true, createdAt: hoursAgo(50) },
      { id: 'ntf_family_ideas', kind: 'recommendation', title: tx('أفكار للعائلة', 'Family ideas'), body: tx('حديقة الملك عبدالله مناسبة لمساء عائلي.', 'King Abdullah Park suits a family evening.'), link: '/discover/plc_king_abdullah_park', read: true, createdAt: hoursAgo(72) },
      { id: 'ntf_plan_done', kind: 'plan_update', title: tx('اكتملت الخطة', 'Plan completed'), body: tx('أنهيت «الدرعية مع العائلة». أحسنت!', 'You finished "Diriyah with the family". Well done!'), link: '/plans/plan_diriyah_done', read: true, createdAt: hoursAgo(140) },
      { id: 'ntf_new_language', kind: 'announcement', title: tx('لغات أكثر قريبًا', 'More languages soon'), body: tx('نعمل على دعم لغات إضافية.', "We're working on more languages."), read: true, createdAt: hoursAgo(300) },
    ],
    prefs: { reminder: true, plan_update: true, recommendation: true, announcement: false },
  };
}
