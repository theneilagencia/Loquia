import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Rotas que requerem autenticação
const protectedRoutes = [
  '/dashboard',
  '/intent',
  '/intent-proof',
  '/feeds',
  '/catalog',
  '/billing',
  '/admin',
];

// Rotas que requerem plano ativo
const subscriptionRequiredRoutes = [
  '/dashboard',
  '/intent',
  '/intent-proof',
  '/feeds',
  '/catalog',
];

// Rotas públicas (não requerem autenticação)
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/debug',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso a rotas públicas
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Permitir acesso a assets e API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    const supabase = createClient(request);
    const { data: { user }, error } = await supabase.auth.getUser();

    // Se não está autenticado e a rota é protegida, redirecionar para login
    if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Se está autenticado, verificar se precisa de plano ativo
    if (user && subscriptionRequiredRoutes.some(route => pathname.startsWith(route))) {
      // Verificar se tem subscription ativa
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, plan_name')
        .eq('user_id', user.id)
        .single();

      // Se não tem subscription ativa, redirecionar para pricing
      if (!subscription || subscription.status !== 'active') {
        const url = request.nextUrl.clone();
        url.pathname = '/pricing';
        url.searchParams.set('message', 'subscription_required');
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // Em caso de erro, permitir acesso (fail-open)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
