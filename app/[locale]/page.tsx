import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('landing');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur">
        <div className="container mx-auto py-4 px-6">
          <div className="flex justify-between items-center">
            <Link href={`/${locale}`}>
              <Image
                src="/logo-white.png"
                alt="Loquia"
                width={120}
                height={30}
                priority
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Hero */}
          <section className="text-center mb-20">
            <h1 className="text-5xl font-bold mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href={`/${locale}/pricing`}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                {t('hero.cta_primary')}
              </Link>
              <Link 
                href={`/${locale}/contact`}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
              >
                {t('hero.cta_secondary')}
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              ✅ TESTE: Novo design está funcionando!
            </p>
          </section>

          {/* Audiences */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t('audiences.title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-800 p-8 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Agências</h3>
                <p className="text-gray-400">Teste de conteúdo</p>
              </div>
              <div className="bg-gray-800 p-8 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Media Buyers</h3>
                <p className="text-gray-400">Teste de conteúdo</p>
              </div>
              <div className="bg-gray-800 p-8 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">PMEs</h3>
                <p className="text-gray-400">Teste de conteúdo</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-gray-500">
              © 2024 Loquia. All rights reserved.
            </p>
            <div className="flex gap-8">
              <Link href={`/${locale}/pricing`} className="text-sm text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href={`/${locale}/addons`} className="text-sm text-gray-400 hover:text-white transition-colors">
                Addons
              </Link>
              <Link href={`/${locale}/contact`} className="text-sm text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
