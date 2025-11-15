import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { GlowButton, GlowCard } from '@/components/glow';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PricingCard } from './pricing-card';
import { 
  ArrowRight,
  Sparkles,
  Star,
  Zap,
  Crown
} from 'lucide-react';

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('pricing');

  const plans = [
    {
      id: 'starter' as const,
      icon: Sparkles,
      color: 'blue',
      popular: false
    },
    {
      id: 'professional' as const,
      icon: Star,
      color: 'purple',
      popular: true
    },
    {
      id: 'advanced' as const,
      icon: Zap,
      color: 'green',
      popular: false
    },
    {
      id: 'enterprise' as const,
      icon: Crown,
      color: 'orange',
      popular: false
    },
    {
      id: 'premium' as const,
      icon: Crown,
      color: 'pink',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/${locale}`} className="text-2xl font-bold text-white">
              Loquia
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => {
            const planData = t.raw(`plans.${plan.id}`);
            
            return (
              <PricingCard
                key={plan.id}
                planId={plan.id}
                planData={planData}
                icon={plan.icon}
                color={plan.color}
                isPopular={plan.popular}
                locale={locale}
              />
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {t('faq.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {t.raw('faq.questions').map((item: any, index: number) => (
              <GlowCard key={index}>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {item.question}
                </h3>
                <p className="text-gray-400">
                  {item.answer}
                </p>
              </GlowCard>
            ))}
          </div>
        </div>

        {/* Compare Plans CTA */}
        <div className="mt-20 text-center">
          <Link href={`/${locale}/pricing/compare`}>
            <GlowButton variant="outline" size="lg">
              {t('compare_plans')}
            </GlowButton>
          </Link>
        </div>

        {/* Final CTA */}
        <div className="mt-32">
          <GlowCard glow glowColor="blue" className="text-center py-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join hundreds of professionals growing with predictability.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/${locale}/auth/sign-up`}>
                <GlowButton size="lg" className="flex items-center space-x-2">
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </GlowButton>
              </Link>
              <Link href={`/${locale}/contact`}>
                <GlowButton variant="outline" size="lg">
                  Talk to Sales
                </GlowButton>
              </Link>
            </div>
          </GlowCard>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 Loquia. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href={`/${locale}`} className="text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
              <Link href={`/${locale}/addons`} className="text-gray-400 hover:text-white transition-colors">
                Addons
              </Link>
              <Link href={`/${locale}/contact`} className="text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
