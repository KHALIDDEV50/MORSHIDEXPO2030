import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ar from '@messages/ar.json';
import en from '@messages/en.json';
import { ScaffoldStatusView } from './scaffold-status-view';

vi.mock('@/shared/i18n', () => ({
  Link: ({ children, locale, ...rest }: { children: ReactNode; locale: string; href: string }) => (
    <a data-locale={locale} {...rest}>
      {children}
    </a>
  ),
}));

function renderIn(locale: 'ar' | 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === 'ar' ? ar : en}>
      <ScaffoldStatusView />
    </NextIntlClientProvider>,
  );
}

describe('ScaffoldStatusView', () => {
  it('renders Arabic copy and offers a switch to English', () => {
    renderIn('ar');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(ar.scaffold.title);
    expect(screen.getByRole('link', { name: ar.common.languageSwitchLabel })).toHaveAttribute(
      'data-locale',
      'en',
    );
  });

  it('renders English copy and offers a switch to Arabic', () => {
    renderIn('en');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.scaffold.title);
    expect(screen.getByRole('link', { name: en.common.languageSwitchLabel })).toHaveAttribute(
      'data-locale',
      'ar',
    );
  });
});
