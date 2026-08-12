import { getRequestConfig } from 'next-intl/server';
import { messages, messagesLocaleFor, isLocale } from '@loquia/i18n';
import { defaultLocale } from '@loquia/i18n';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && isLocale(requested) ? requested : (routing.defaultLocale ?? defaultLocale);
  const bundleLocale = messagesLocaleFor(locale);

  return {
    locale,
    messages: messages[bundleLocale],
  };
});
