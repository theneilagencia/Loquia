import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from '@loquia/i18n';

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});
