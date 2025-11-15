import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { LandingClient } from './landing-client';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('landing');

  // Prepare data for client component
  const landingData = {
    hero: {
      title: t('hero.title'),
      subtitle: t('hero.subtitle'),
      cta_primary: t('hero.cta_primary'),
      cta_secondary: t('hero.cta_secondary'),
      cta_premium: t('hero.cta_premium')
    },
    audiences: {
      title: t('audiences.title'),
      subtitle: t('audiences.subtitle'),
      agency: t.raw('audiences.agency'),
      media_buyer: t.raw('audiences.media_buyer'),
      sme: t.raw('audiences.sme'),
      common_goal: t.raw('audiences.common_goal')
    },
    benefits: t.raw('benefits'),
    problem: t.raw('problem'),
    guide: t.raw('guide'),
    plan: t.raw('plan'),
    success: t.raw('success'),
    failure: t.raw('failure'),
    cta_final: t.raw('cta_final')
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Gradient Mesh Background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'var(--gradient-mesh)', opacity: 0.5 }}
      />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container-wide py-4">
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
      <LandingClient locale={locale} data={landingData} />

      {/* Footer */}
      <footer className="relative py-12 border-t" style={{ borderColor: 'var(--border-primary)' }}>
        <div className="container-wide">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-small" style={{ color: 'var(--fg-tertiary)' }}>
              © 2024 Loquia. All rights reserved.
            </p>
            <div className="flex gap-8">
              <Link 
                href={`/${locale}/pricing`}
                className="text-small hover:opacity-70 transition-opacity"
                style={{ color: 'var(--fg-secondary)' }}
              >
                Pricing
              </Link>
              <Link 
                href={`/${locale}/addons`}
                className="text-small hover:opacity-70 transition-opacity"
                style={{ color: 'var(--fg-secondary)' }}
              >
                Addons
              </Link>
              <Link 
                href={`/${locale}/contact`}
                className="text-small hover:opacity-70 transition-opacity"
                style={{ color: 'var(--fg-secondary)' }}
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
