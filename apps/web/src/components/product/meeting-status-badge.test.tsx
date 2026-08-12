import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { messages } from '@loquia/i18n';
import { MeetingStatusBadge } from './meeting-status-badge';

function renderWithIntl(locale: 'pt-BR' | 'en-US', node: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {node}
    </NextIntlClientProvider>,
  );
}

describe('MeetingStatusBadge (i18n)', () => {
  it('renders the localized label in Portuguese', () => {
    renderWithIntl('pt-BR', <MeetingStatusBadge status="ready" />);
    expect(screen.getByText('Pronta')).toBeInTheDocument();
  });

  it('renders the localized label in English', () => {
    renderWithIntl('en-US', <MeetingStatusBadge status="ready" />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
});
