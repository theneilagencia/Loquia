import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NavbarLinks } from '@/components/navbar-links';
import { LoginForm } from '@/components/login-form';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function LoginPage() {
  const t = await getTranslations('login');

  return (
    <>
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12 flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-white.png"
              alt="Loquia"
              width={120}
              height={30}
              className="h-8 w-auto"
              priority
            />
          </Link>
          
          <NavbarLinks />
          
          <LanguageSwitcher />
        </div>
      </header>

      {/* PREMIUM ANIMATED BACKGROUND */}
      <div className="premium-bg">
        {/* Geometric Shapes */}
        <div className="geometric-circle-1" />
        <div className="geometric-circle-2" />
        <div className="geometric-circle-3" />
        <div className="geometric-hexagon-1" />
        <div className="geometric-hexagon-2" />
        <div className="geometric-line-1" />
        <div className="geometric-line-2" />
        <div className="geometric-orb-1" />
        <div className="geometric-orb-2" />
      </div>

      {/* MAIN CONTENT */}
      <main className="relative min-h-screen flex items-center justify-center px-6 py-24 md:py-32">
        <div className="w-full max-w-md scroll-reveal">
          {/* Login Card */}
          <div className="premium-card p-8 md:p-10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/logo-white.png"
                alt="Loquia"
                width={150}
                height={38}
                className="h-10 w-auto"
                priority
              />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{letterSpacing: '-0.02em'}}>
                Bem-vindo de volta
              </h1>
              <p className="text-white/60">
                Entre com sua conta Loquia
              </p>
            </div>

            <LoginForm />
          </div>

          {/* Security Note */}
          <p className="text-center text-sm text-white/40 mt-6">
            Ao entrar, você concorda com nossos{' '}
            <Link href="/terms" className="text-white/60 hover:text-white transition-colors">
              Termos de Serviço
            </Link>{' '}
            e{' '}
            <Link href="/privacy" className="text-white/60 hover:text-white transition-colors">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative border-t border-white/[0.08] py-12 md:py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/pricing" className="hover:text-white transition-colors">
                Ver planos
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contato
              </Link>
            </div>
            <p className="text-sm text-white/40">
              © 2025 Loquia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
