import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import '../globals.css';

export function generateStaticParams() {
  return [{ locale: 'pt' }, { locale: 'en' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  let messages;
  try {
    messages = {
      common: (await import(`@/messages/${locale}/common.json`)).default,
      home: (await import(`@/messages/${locale}/home.json`)).default,
      auth: (await import(`@/messages/${locale}/auth.json`)).default,
      campaigns: (await import(`@/messages/${locale}/campaigns.json`)).default,
      insights: (await import(`@/messages/${locale}/insights.json`)).default,
      optimizations: (await import(`@/messages/${locale}/optimizations.json`)).default,
      setup: (await import(`@/messages/${locale}/setup.json`)).default,
      errors: (await import(`@/messages/${locale}/errors.json`)).default,
      validation: (await import(`@/messages/${locale}/validation.json`)).default,
      navbar: (await import(`@/messages/${locale}/navbar.json`)).default,
      approvals: (await import(`@/messages/${locale}/approvals.json`)).default,
      comments: (await import(`@/messages/${locale}/comments.json`)).default,
      market: (await import(`@/messages/${locale}/market.json`)).default,
      voice: (await import(`@/messages/${locale}/voice.json`)).default,
    };
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale} className="dark">
      <head>
        <script src="/animations.js" defer />
      </head>
      <body className="min-h-screen bg-black text-white">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
