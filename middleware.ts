import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createMiddleware({
  locales: ['pt', 'en'],
  defaultLocale: 'pt',
  localePrefix: 'always',
  localeDetection: false // Desabilita detecção automática do navegador
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply i18n routing
  const response = intlMiddleware(request);

  // Auth check for protected routes
  const protectedPaths = ['/campaigns', '/setup'];
  const isProtected = protectedPaths.some(path => pathname.includes(path));

  if (isProtected) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const locale = pathname.split('/')[1] || 'pt';
      return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
