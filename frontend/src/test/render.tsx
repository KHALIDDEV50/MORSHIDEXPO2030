import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import ar from '@messages/ar.json';
import en from '@messages/en.json';

export const messages = { ar, en };

/** Render with the real translation dictionaries (Arabic by default, like the app). */
export function renderWithIntl(ui: ReactElement, locale: 'ar' | 'en' = 'ar') {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Asia/Riyadh">
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>{ui}</div>
    </NextIntlClientProvider>,
  );
}
