import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/language-switcher';
import { CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function PricingPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('pricing');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '84',
      tagline: 'Para começar com clareza',
      description: 'Ideal para quem quer organizar campanhas e ter visão consolidada',
      features: [
        '3 campanhas ativas',
        '2 plataformas conectadas',
        'Painel essencial',
        'Relatórios básicos',
        'Timeline simples'
      ],
      cta: 'Começar agora',
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '128',
      tagline: 'Mais controle e insights',
      description: 'Para profissionais que precisam de recomendações práticas',
      features: [
        '10 campanhas ativas',
        'Todas as plataformas',
        'Recomendações práticas',
        'Setup Center completo',
        'Exportações PDF/CSV',
        'Suporte prioritário'
      ],
      cta: 'Começar teste gratuito',
      popular: true
    },
    {
      id: 'advanced',
      name: 'Advanced',
      price: '168',
      tagline: 'Controle total e automação',
      description: 'Para equipes que querem escalar com previsibilidade',
      features: [
        'Campanhas ilimitadas',
        'Controles avançados',
        'Automações personalizadas',
        'API access',
        'Webhooks',
        'Suporte dedicado'
      ],
      cta: 'Começar teste gratuito',
      popular: false
    }
  ];

  return (
    <>
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12 flex items-center justify-between h-16 md:h-20">
          <Link href={`/${params.locale}`} className="flex items-center">
            <Image
              src="/logo-white.png"
              alt="Loquia"
              width={120}
              height={30}
              className="h-8 w-auto"
              priority
            />
          </Link>
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
        <div className="diagonal-lines" />
        
        {/* Subtle Orbs */}
        <div className="subtle-orb-1" />
        <div className="subtle-orb-2" />
        
        {/* Grid Pattern */}
        <div className="grid-pattern" />
      </div>

      {/* MAIN CONTENT */}
      <main className="pt-16 md:pt-20 relative z-10">
        {/* HERO SECTION */}
        <section className="py-20 md:py-32 lg:py-40 relative">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12 text-center relative z-10">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none mb-6 opacity-0 animate-fade-in-up" style={{letterSpacing: '-0.03em', textWrap: 'balance'}}>
              Planos que crescem com você
            </h1>
            <p className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-12 text-white/70 opacity-0 animate-fade-in-up animate-delay-200" style={{textWrap: 'balance'}}>
              Escolha o plano ideal para organizar suas campanhas, identificar oportunidades e crescer com previsibilidade
            </p>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* PRICING CARDS */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 grid-stagger">
              {plans.map((plan, index) => (
                <div 
                  key={plan.id} 
                  className={`premium-card ${plan.popular ? 'border-emerald-500/30' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-emerald-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
                        Mais popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2" style={{letterSpacing: '-0.01em'}}>
                      {plan.name}
                    </h3>
                    <p className="text-sm text-white/60 italic mb-4">
                      {plan.tagline}
                    </p>
                    <div className="flex items-baseline justify-center mb-4">
                      <span className="text-white/50 text-sm">USD</span>
                      <span className="text-5xl md:text-6xl font-bold mx-2">
                        {plan.price}
                      </span>
                      <span className="text-white/50 text-sm">/mês</span>
                    </div>
                  </div>

                  <p className="text-sm md:text-base text-white/60 mb-6 text-center">
                    {plan.description}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm md:text-base text-white/70">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link 
                    href={`/${params.locale}/auth/sign-up`}
                    className={`inline-flex items-center justify-center w-full gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      plan.popular 
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400 glow-emerald-hover' 
                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* FINAL CTA */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-6" style={{letterSpacing: '-0.02em', textWrap: 'balance'}}>
              Precisa de um plano personalizado?
            </h2>
            <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-8 text-white/70">
              Entre em contato para discutir suas necessidades e criar um plano sob medida
            </p>
            
            <Link 
              href={`/${params.locale}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20"
            >
              Falar com especialista
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] py-8 relative z-10">
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-white/40 text-sm">
              © 2024 Loquia. Todos os direitos reservados.
            </div>
            <div className="flex gap-6">
              <Link href={`/${params.locale}`} className="text-white/40 hover:text-white transition-colors text-sm">
                Home
              </Link>
              <Link href={`/${params.locale}/addons`} className="text-white/40 hover:text-white transition-colors text-sm">
                Addons
              </Link>
              <Link href={`/${params.locale}/roi-calculator`} className="text-white/40 hover:text-white transition-colors text-sm">
                ROI Calculator
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
