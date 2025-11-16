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
                  className={`premium-card relative ${plan.popular ? 'border-emerald-500/30' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-emerald-500 text-black px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
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
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16 md:my-24" />
        </div>

        {/* ADDONS SECTION */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-4" style={{letterSpacing: '-0.02em'}}>
                Módulos Opcionais que Entregam Vantagens Exclusivas
              </h2>
              <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto text-white/70">
                Adicione funcionalidades específicas ao seu plano e ganhe vantagens competitivas imediatas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
              {/* Addon 1: Qualificação Inteligente de Leads por Voz */}
              <div className="premium-card scroll-reveal tilt-on-hover relative">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2" style={{letterSpacing: '-0.01em'}}>
                      Qualificação Inteligente de Leads por Voz
                    </h3>
                    <p className="text-sm text-emerald-500 font-semibold uppercase tracking-wide mb-3">
                      Filtre leads com potencial real
                    </p>
                  </div>
                </div>

                <p className="text-sm md:text-base text-white/60 mb-6">
                  Ideal para quem precisa filtrar rapidamente leads que realmente têm potencial. O sistema faz a primeira conversa, coleta informações e ajuda você a priorizar quem vale a pena.
                </p>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-3">Benefícios diretos</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/70">Atendimento imediato</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/70">Menos tempo gasto com leads frios</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/70">Aumento de conversão de oportunidades</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/70">Escalabilidade sem contratar equipe</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <div>
                    <span className="text-white/50 text-sm">USD</span>
                    <span className="text-3xl font-bold mx-1">42</span>
                    <span className="text-white/50 text-sm">/mês</span>
                  </div>
                  <Link 
                    href={`/${params.locale}/auth/sign-up`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 text-sm"
                  >
                    Adicionar ao plano
                  </Link>
                </div>
              </div>

              {/* Addon 2: Diagnóstico e Planejamento Automático */}
              <div className="premium-card scroll-reveal tilt-on-hover relative">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2" style={{letterSpacing: '-0.01em'}}>
                      Diagnóstico e Planejamento Automático
                    </h3>
                    <p className="text-sm text-emerald-500 font-semibold uppercase tracking-wide mb-3">
                      Acelere diagnósticos e planos estratégicos
                    </p>
                  </div>
                </div>

                <p className="text-sm md:text-base text-white/60 mb-6">
                  Para quem quer acelerar a criação de diagnósticos e planos estratégicos. O módulo analisa páginas públicas e extrai informações úteis para montar uma base sólida para suas campanhas.
                </p>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-3">Benefícios diretos</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/70">Economia de horas de pesquisa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/70">Plano estratégico mais completo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/70">Visão de mercado clara</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/70">Diagnósticos mais profissionais</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <div>
                    <span className="text-white/50 text-sm">USD</span>
                    <span className="text-3xl font-bold mx-1">38</span>
                    <span className="text-white/50 text-sm">/mês</span>
                  </div>
                  <Link 
                    href={`/${params.locale}/auth/sign-up`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 text-sm"
                  >
                    Adicionar ao plano
                  </Link>
                </div>
              </div>
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
