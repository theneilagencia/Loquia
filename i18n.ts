import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['pt', 'en'] as const;
export const defaultLocale = 'pt' as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: {
      common: (await import(`./messages/${locale}/common.json`)).default,
      home: (await import(`./messages/${locale}/home.json`)).default,
      auth: (await import(`./messages/${locale}/auth.json`)).default,
      campaigns: (await import(`./messages/${locale}/campaigns.json`)).default,
      insights: (await import(`./messages/${locale}/insights.json`)).default,
      optimizations: (await import(`./messages/${locale}/optimizations.json`)).default,
      setup: (await import(`./messages/${locale}/setup.json`)).default,
      errors: (await import(`./messages/${locale}/errors.json`)).default,
      validation: (await import(`./messages/${locale}/validation.json`)).default,
      navbar: (await import(`./messages/${locale}/navbar.json`)).default,
      landing: (await import(`./messages/${locale}/landing.json`)).default,
      pricing: (await import(`./messages/${locale}/pricing.json`)).default,
      addons: (await import(`./messages/${locale}/addons.json`)).default,
      roi: (await import(`./messages/${locale}/roi.json`)).default,
    }
  };
});
