import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@loquia/i18n';
import { routing } from '@/i18n/routing';
import { AppProviders } from '@/components/providers';
import { manrope, geistMono } from '../fonts';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const themeInit = `(function(){try{var t=localStorage.getItem('loquia:theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

// Cold-start recovery: on the free tier the server can serve the HTML shell while
// still waking up, so the follow-up /_next/static/*.js chunk requests get aborted
// and React never hydrates — leaving a dead page (e.g. the login button does a
// useless form GET). This catches a failed static-chunk load and reloads ONCE (a
// warm instance then serves the chunks and hydration succeeds). A 15s cooldown +
// a hard 2-attempt cap per session guarantee it can never loop, even if a chunk
// is genuinely missing.
const chunkRecovery = `(function(){try{var C='loquia:chunkReload';window.addEventListener('error',function(e){var el=e&&e.target;if(!el||!el.tagName)return;var tag=(''+el.tagName).toLowerCase();var src=el.src||el.href||'';if((tag!=='script'&&tag!=='link')||src.indexOf('/_next/static/')===-1)return;var n=Date.now(),last=0,cnt=0;try{var raw=sessionStorage.getItem(C);if(raw){var p=raw.split('|');last=parseInt(p[0],10)||0;cnt=parseInt(p[1],10)||0;}}catch(_){}if(cnt>=2)return;if(n-last<15000)return;try{sessionStorage.setItem(C,n+'|'+(cnt+1));}catch(_){}location.reload();},true);}catch(e){}})();`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${manrope.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script dangerouslySetInnerHTML={{ __html: chunkRecovery }} />
      </head>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
