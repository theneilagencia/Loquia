import type { Preview } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { messages } from '@loquia/i18n';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disable: true },
  },
  globalTypes: {
    locale: {
      description: 'Locale',
      defaultValue: 'pt-BR',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'pt-BR', title: 'PT-BR' },
          { value: 'en-US', title: 'EN-US' },
        ],
      },
    },
    theme: {
      description: 'Theme',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const locale = (context.globals.locale as 'pt-BR' | 'en-US') ?? 'pt-BR';
      const theme = (context.globals.theme as string) ?? 'light';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      return (
        <NextIntlClientProvider locale={locale} messages={messages[locale]}>
          <div className="bg-background p-6 text-foreground">
            <Story />
          </div>
        </NextIntlClientProvider>
      );
    },
  ],
};

export default preview;
