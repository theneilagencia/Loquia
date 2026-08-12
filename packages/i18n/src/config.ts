import { ACTIVE_LOCALES, ALL_LOCALES, DEFAULT_LOCALE } from '@loquia/domain';
import type { ActiveLocale, Locale } from '@loquia/domain';

/**
 * Locale routing configuration for next-intl.
 *
 * `locales` are the routable locales (URL-prefixed). Milestone 1 ships full
 * translations for pt-BR and en-US; the four planned locales are routable but
 * fall back to en-US messages until translated (architecture is ready).
 */
export const locales: readonly Locale[] = ALL_LOCALES;
export const activeLocales: readonly ActiveLocale[] = ACTIVE_LOCALES;
export const defaultLocale: Locale = DEFAULT_LOCALE;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Locale whose message bundle should be used to render `locale`. */
export function messagesLocaleFor(locale: Locale): ActiveLocale {
  if ((activeLocales as readonly string[]).includes(locale)) {
    return locale as ActiveLocale;
  }
  // Spanish-family and other planned locales fall back to en-US for now.
  return 'en-US';
}
