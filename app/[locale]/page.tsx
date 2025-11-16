import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NavbarLinks } from '@/components/navbar-links';

import { CTAFinal } from '@/components/cta-final';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function LandingPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('landing');

  const hero = {
    title: t('hero.title'),
    subtitle: t('hero.subtitle'),
    cta1: t('hero.cta_primary'),
    cta2: t('hero.cta_secondary'),
    cta3: t('hero.cta_tertiary'),
  };

  const problem = {
    title: t('problem.title'),
    subtitle: t('problem.subtitle'),
    items: t.raw('problem.issues') as Array<{title: string; description: string}>,
  };

  const solution = {
    title: t('solution.title'),
    intro: t('solution.intro'),
    benefits: t.raw('solution.benefits') as Array<{title: string; description: string}>,
  };

  const features = {
    title: t('features.title'),
    items: t.raw('features.items') as Array<{title: string; description: string}>,
  };

  const audience = {
    title: t('target_audience.title'),
    subtitle: t('target_audience.subtitle'),
    profiles: t.raw('target_audience.profiles') as Array<{title: string; description: string}>,
  };

  const howItWorks = {
    title: t('how_it_works.title'),
    subtitle: t('how_it_works.subtitle'),
    steps: t.raw('how_it_works.steps') as Array<{title: string; description: string}>,
  };

  const stats = {
    title: t('social_proof.title'),
    subtitle: t('social_proof.subtitle'),
    items: t.raw('social_proof.stats') as Array<{value: string; label: string}>,
  };

  const cta = {
    title: t('cta_final.title'),
    subtitle: t('cta_final.subtitle'),
    button: t('cta_final.cta_primary'),
    note: t('cta_final.guarantee'),
  };

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
        <section className="py-20 md:py-32 lg:py-40 relative bg-animated-gradient">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12 text-center relative z-10">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none mb-6 opacity-0 animate-fade-in-up" style={{letterSpacing: '-0.03em', textWrap: 'balance'}}>
              {hero.title}
            </h1>
            <p className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-12 text-white/70 opacity-0 animate-fade-in-up animate-delay-200" style={{textWrap: 'balance'}}>
              {hero.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up animate-delay-400">
              <Link 
                href="/auth/login" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-emerald-500 text-black hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black glow-emerald-hover magnetic-button shine-effect"
              >
                {hero.cta1}
              </Link>
              <Link 
                href="/roi-calculator" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 text-white/70 hover:text-white hover:bg-white/5"
              >
                {hero.cta3}
              </Link>
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16 md:my-24" />
        </div>

        {/* PROBLEM SECTION */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-4" style={{letterSpacing: '-0.02em'}}>
                {problem.title}
              </h2>
              <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto text-white/70">
                {problem.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12 grid-stagger">
              {problem.items.map((item, index) => (
                <div 
                  key={index} 
                  className="premium-card scroll-reveal tilt-on-hover"
                >
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight leading-snug mb-3" style={{letterSpacing: '-0.01em'}}>
                    {item.title}
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed text-white/60">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16 md:my-24" />
        </div>

        {/* SOLUTION SECTION */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-4" style={{letterSpacing: '-0.02em'}}>
                {solution.title}
              </h2>
              <p className="text-base md:text-lg leading-relaxed max-w-3xl mx-auto text-white/65">
                {solution.intro}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {solution.benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="premium-card scroll-reveal tilt-on-hover"
                >
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight leading-snug mb-3 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent" style={{letterSpacing: '-0.01em'}}>
                    {benefit.title}
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed text-white/60">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16 md:my-24" />
        </div>

        {/* FEATURES SECTION */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-center mb-16" style={{letterSpacing: '-0.02em'}}>
              {features.title}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.items.map((item, index) => (
                <div 
                  key={index} 
                  className="premium-card scroll-reveal tilt-on-hover"
                >
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight leading-snug mb-3" style={{letterSpacing: '-0.01em'}}>
                    {item.title}
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed text-white/60">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16 md:my-24" />
        </div>

        {/* AUDIENCE SECTION */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-4" style={{letterSpacing: '-0.02em'}}>
                {audience.title}
              </h2>
              <p className="text-lg md:text-xl leading-relaxed text-white/70">
                {audience.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {audience.profiles.map((profile, index) => (
                <div 
                  key={index} 
                  className="premium-card text-center"
                >
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight leading-snug mb-4" style={{letterSpacing: '-0.01em'}}>
                    {profile.title}
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed text-white/60">
                    {profile.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16 md:my-24" />
        </div>

        {/* HOW IT WORKS SECTION */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-4" style={{letterSpacing: '-0.02em'}}>
                {howItWorks.title}
              </h2>
              <p className="text-lg md:text-xl leading-relaxed text-white/70">
                {howItWorks.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {howItWorks.steps.map((step, index) => (
                <div 
                  key={index} 
                  className="premium-card text-center"
                >
                  <div className="text-5xl font-bold text-emerald-500 mb-4">{index + 1}</div>
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight leading-snug mb-3" style={{letterSpacing: '-0.01em'}}>
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed text-white/60">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16 md:my-24" />
        </div>

        {/* PLATFORM MODULES SECTION */}
        <section className="py-16 md:py-24 lg:py-32 relative bg-animated-gradient">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-6" style={{letterSpacing: '-0.02em'}}>
                Conheça os módulos da plataforma
              </h2>
              <p className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto text-white/70">
                A plataforma é formada por módulos práticos e orientados a negócio.<br />
                Cada um resolve um problema real e cria uma vantagem imediata.
              </p>
            </div>

            <div className="space-y-12 md:space-y-16">
              {/* Módulo 1: Loquia Hub */}
              <div className="grid md:grid-cols-[auto,1fr] gap-6 md:gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl md:text-3xl font-bold text-emerald-500">1</span>
                  </div>
                </div>
                <div className="premium-card scroll-reveal tilt-on-hover">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug mb-3" style={{letterSpacing: '-0.01em'}}>
                    Loquia Hub
                  </h3>
                  <p className="text-base md:text-lg leading-relaxed text-white/70 mb-6">
                    Reúne suas contas Google, Meta, TikTok, LinkedIn, X e YouTube em um só lugar.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-2">Por que isso importa</h4>
                      <p className="text-sm md:text-base leading-relaxed text-white/60">
                        Você vê tudo ao mesmo tempo, identifica desvios, compara resultados e sabe exatamente onde mexer.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-2">Benefício direto</h4>
                      <p className="text-sm md:text-base leading-relaxed text-white/60">
                        Menos confusão, menos aba aberta, mais clareza diária.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Módulo 2: Loquia Insight Center */}
              <div className="grid md:grid-cols-[auto,1fr] gap-6 md:gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl md:text-3xl font-bold text-emerald-500">2</span>
                  </div>
                </div>
                <div className="premium-card scroll-reveal tilt-on-hover">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug mb-3" style={{letterSpacing: '-0.01em'}}>
                    Loquia Insight Center
                  </h3>
                  <p className="text-base md:text-lg leading-relaxed text-white/70 mb-6">
                    Mostra rapidamente o que está funcionando, onde estão os desperdícios e quais áreas merecem atenção.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-2">Como isso afeta seu resultado</h4>
                      <p className="text-sm md:text-base leading-relaxed text-white/60">
                        Você descobre por que o custo subiu, por que uma campanha perdeu força, qual segmentação está puxando o resultado e o que mudou de ontem para hoje.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-2">Benefício direto</h4>
                      <p className="text-sm md:text-base leading-relaxed text-white/60">
                        Você age com segurança e evita decisões ruins.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Módulo 3: Loquia Action Priority */}
              <div className="grid md:grid-cols-[auto,1fr] gap-6 md:gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl md:text-3xl font-bold text-emerald-500">3</span>
                  </div>
                </div>
                <div className="premium-card scroll-reveal tilt-on-hover">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug mb-3" style={{letterSpacing: '-0.01em'}}>
                    Loquia Action Priority
                  </h3>
                  <p className="text-base md:text-lg leading-relaxed text-white/70 mb-6">
                    Transforma análise em movimento, mostrando o que deve ser ajustado e qual impacto esperar.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-2">Por que isso é poderoso</h4>
                      <p className="text-sm md:text-base leading-relaxed text-white/60">
                        Você não perde tempo no achismo. As melhorias ficam claras, visíveis e ordenadas.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-2">Benefício direto</h4>
                      <p className="text-sm md:text-base leading-relaxed text-white/60">
                        Crescimento consistente, mês após mês.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Módulo 4: Loquia Timeline */}
              <div className="grid md:grid-cols-[auto,1fr] gap-6 md:gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl md:text-3xl font-bold text-emerald-500">4</span>
                  </div>
                </div>
                <div className="premium-card scroll-reveal tilt-on-hover">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug mb-3" style={{letterSpacing: '-0.01em'}}>
                    Loquia Timeline
                  </h3>
                  <p className="text-base md:text-lg leading-relaxed text-white/70 mb-6">
                    Um histórico simples e visual que mostra tudo o que aconteceu na sua conta.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-2">Por que isso importa</h4>
                      <p className="text-sm md:text-base leading-relaxed text-white/60">
                        Você comprova evolução, mostra valor, evita erros repetidos e comunica com clareza com clientes, sócios e liderança.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide mb-2">Benefício direto</h4>
                      <p className="text-sm md:text-base leading-relaxed text-white/60">
                        Transparência de ponta a ponta.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16 md:my-24" />
        </div>

        {/* MÓDULOS OPCIONAIS SECTION */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-4" style={{letterSpacing: '-0.02em'}}>
                Módulos adicionais que entregam diferenciais para o seu negócio
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {/* Qualificação Inteligente */}
              <div className="premium-card scroll-reveal tilt-on-hover">
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug mb-4" style={{letterSpacing: '-0.01em'}}>
                  Qualificação Inteligente de Leads por Voz
                </h3>
                <p className="text-base md:text-lg leading-relaxed text-white/70 mb-6">
                  Ideal para quem precisa filtrar rapidamente leads que realmente têm potencial. O sistema faz a primeira conversa, coleta informações e ajuda você a priorizar quem vale a pena.
                </p>
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-emerald-500 mb-3">Benefícios diretos</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <span className="text-sm md:text-base leading-relaxed text-white/60">Atendimento imediato</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <span className="text-sm md:text-base leading-relaxed text-white/60">Menos tempo gasto com leads frios</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <span className="text-sm md:text-base leading-relaxed text-white/60">Aumento de conversão de oportunidades</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <span className="text-sm md:text-base leading-relaxed text-white/60">Escalabilidade sem contratar equipe</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Diagnóstico e Planejamento */}
              <div className="premium-card scroll-reveal tilt-on-hover">
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug mb-4" style={{letterSpacing: '-0.01em'}}>
                  Diagnóstico e Planejamento Automático
                </h3>
                <p className="text-base md:text-lg leading-relaxed text-white/70 mb-6">
                  Para quem quer acelerar a criação de diagnósticos e planos estratégicos. O módulo analisa páginas públicas e extrai informações úteis para montar uma base sólida para suas campanhas.
                </p>
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-emerald-500 mb-3">Benefícios diretos</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <span className="text-sm md:text-base leading-relaxed text-white/60">Economia de horas de pesquisa</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <span className="text-sm md:text-base leading-relaxed text-white/60">Plano estratégico mais completo</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <span className="text-sm md:text-base leading-relaxed text-white/60">Visão de mercado clara</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <span className="text-sm md:text-base leading-relaxed text-white/60">Diagnósticos mais profissionais</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-20 md:py-32 lg:py-40" style={{background: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)'}}>
          <div className="mx-auto max-w-[800px] px-6 md:px-8 text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6" style={{letterSpacing: '-0.025em', textWrap: 'balance'}}>
              {cta.title}
            </h2>
            <p className="text-lg md:text-xl leading-relaxed mb-12 text-white/70">
              {cta.subtitle}
            </p>
            
            <CTAFinal buttonText={cta.button} />
            
            <p className="text-sm md:text-base leading-relaxed mt-6 text-white/60">
              {cta.note}
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] py-12 md:py-16 bg-white/[0.01]">
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-xl font-bold">Loquia</div>
            
            <nav className="flex gap-8">
              <Link href="/pricing" className="text-white/60 hover:text-white transition-colors duration-200">
                Ver planos
              </Link>
              <Link href="/addons" className="text-white/60 hover:text-white transition-colors duration-200">
                Addons
              </Link>
              <Link href="/contact" className="text-white/60 hover:text-white transition-colors duration-200">
                Contato
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
