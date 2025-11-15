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
          
          {/* SEÇÃO 1 - HERO */}
          <section className="text-center mb-32">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-4xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link 
                href={`/${locale}/pricing`}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-lg"
              >
                {t('hero.cta_primary')}
              </Link>
              <Link 
                href={`/${locale}/pricing`}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-lg"
              >
                {t('hero.cta_secondary')}
              </Link>
              <Link 
                href={`/${locale}/roi-calculator`}
                className="px-8 py-4 border-2 border-gray-700 hover:border-gray-600 rounded-lg font-semibold transition-colors text-lg"
              >
                {t('hero.cta_tertiary')}
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              {t('hero.available_in')}
            </p>
          </section>

          {/* SEÇÃO 2 - O PROBLEMA */}
          <section className="mb-32">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-6">
                {t('problem.title')}
              </h2>
              <p className="text-xl text-gray-400 text-center mb-16">
                {t('problem.subtitle')}
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {t.raw('problem.issues').map((issue: any, index: number) => (
                  <div key={index} className="bg-gray-800/50 p-8 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-semibold mb-3">{issue.title}</h3>
                    <p className="text-gray-400">{issue.description}</p>
                  </div>
                ))}
              </div>

              <p className="text-center text-xl text-red-400 font-semibold">
                {t('problem.conclusion')}
              </p>
            </div>
          </section>

          {/* SEÇÃO 3 - APRESENTAÇÃO DO LOQUIA */}
          <section className="mb-32">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-6">
                {t('solution.title')}
              </h2>
              <p className="text-xl text-gray-400 text-center mb-8">
                {t('solution.subtitle')}
              </p>
              <p className="text-lg text-gray-300 text-center mb-16 leading-relaxed">
                {t('solution.intro')}
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-20">
                {t.raw('solution.benefits').map((benefit: any, index: number) => (
                  <div key={index} className="bg-gradient-to-br from-blue-900/20 to-gray-800/20 p-8 rounded-lg border border-blue-800/30">
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">{benefit.title}</h3>
                    <p className="text-gray-400">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* O LOQUIA AJUDA VOCÊ A */}
          <section className="mb-32">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16">
                {t('features.title')}
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {t.raw('features.items').map((item: any, index: number) => (
                  <div key={index} className="bg-gray-800 p-8 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PARA QUEM É O LOQUIA */}
          <section className="mb-32">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-6">
                {t('target_audience.title')}
              </h2>
              <p className="text-xl text-gray-400 text-center mb-16">
                {t('target_audience.subtitle')}
              </p>
              
              <div className="grid md:grid-cols-3 gap-8">
                {t.raw('target_audience.profiles').map((profile: any, index: number) => (
                  <div key={index} className="bg-gray-800 p-8 rounded-lg">
                    <h3 className="text-2xl font-semibold mb-4">{profile.name}</h3>
                    <p className="text-gray-400">{profile.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* COMO FUNCIONA */}
          <section className="mb-32">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-6">
                {t('how_it_works.title')}
              </h2>
              <p className="text-xl text-gray-400 text-center mb-16">
                {t('how_it_works.subtitle')}
              </p>
              
              <div className="space-y-8">
                {t.raw('how_it_works.steps').map((step: any, index: number) => (
                  <div key={index} className="flex gap-6 items-start bg-gray-800/50 p-8 rounded-lg">
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                      <p className="text-gray-400 text-lg">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* RESULTADOS REAIS */}
          <section className="mb-32">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-6">
                {t('social_proof.title')}
              </h2>
              <p className="text-xl text-gray-400 text-center mb-16">
                {t('social_proof.subtitle')}
              </p>
              
              <div className="grid md:grid-cols-3 gap-8">
                {t.raw('social_proof.stats').map((stat: any, index: number) => (
                  <div key={index} className="bg-gradient-to-br from-green-900/20 to-gray-800/20 p-12 rounded-lg border border-green-800/30 text-center">
                    <div className="text-5xl font-bold text-green-400 mb-4">{stat.value}</div>
                    <div className="text-gray-300 text-lg">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA FINAL */}
          <section className="text-center">
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-900/30 to-gray-800/30 p-16 rounded-2xl border border-blue-800/30">
              <h2 className="text-4xl font-bold mb-6">
                {t('cta_final.title')}
              </h2>
              <p className="text-xl text-gray-400 mb-10">
                {t('cta_final.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Link 
                  href={`/${locale}/pricing`}
                  className="px-10 py-5 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-lg"
                >
                  {t('cta_final.cta_primary')}
                </Link>
                <Link 
                  href={`/${locale}/contact`}
                  className="px-10 py-5 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-lg"
                >
                  {t('cta_final.cta_secondary')}
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                {t('cta_final.guarantee')}
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 mt-20">
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
