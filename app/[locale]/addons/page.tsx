import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { LocaleLink } from '@/components/locale-link';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/language-switcher';
import { CheckCircle2, Phone, BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AddonsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('addons');

  const addons = [
    {
      id: 'qualificacao',
      name: 'Qualificação Inteligente de Leads por Voz',
      icon: Phone,
      tagline: 'Filtre leads com potencial real',
      description: 'Ideal para quem precisa filtrar rapidamente leads que realmente têm potencial. O sistema faz a primeira conversa, coleta informações e ajuda você a priorizar quem vale a pena.',
      benefits: [
        'Atendimento imediato',
        'Menos tempo gasto com leads frios',
        'Aumento de conversão de oportunidades',
        'Escalabilidade sem contratar equipe'
      ],
      price: '42',
      cta: 'Adicionar ao plano'
    },
    {
      id: 'diagnostico',
      name: 'Diagnóstico e Planejamento Automático',
      icon: BarChart3,
      tagline: 'Acelere diagnósticos e planos estratégicos',
      description: 'Para quem quer acelerar a criação de diagnósticos e planos estratégicos. O módulo analisa páginas públicas e extrai informações úteis para montar uma base sólida para suas campanhas.',
      benefits: [
        'Economia de horas de pesquisa',
        'Plano estratégico mais completo',
        'Visão de mercado clara',
        'Diagnósticos mais profissionais'
      ],
      price: '38',
      cta: 'Adicionar ao plano'
    }
  ];

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
          </LocaleLink>
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
              Módulos Opcionais que Entregam Vantagens Exclusivas
            </h1>
            <p className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-12 text-white/70 opacity-0 animate-fade-in-up animate-delay-200" style={{textWrap: 'balance'}}>
              Adicione funcionalidades específicas ao seu plano e ganhe vantagens competitivas imediatas
            </p>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* ADDONS CARDS */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 grid-stagger">
              {addons.map((addon, index) => (
                <div key={addon.id} className="premium-card scroll-reveal tilt-on-hover">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <addon.icon className="w-7 h-7 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2" style={{letterSpacing: '-0.01em'}}>
                        {addon.name}
                      </h3>
                      <p className="text-sm text-emerald-500 font-medium">
                        {addon.tagline}
                      </p>
                    </div>
                  </div>

                  <p className="text-base md:text-lg text-white/70 mb-6 leading-relaxed">
                    {addon.description}
                  </p>

                  <div className="mb-8">
                    <h4 className="text-sm font-semibold text-emerald-500 uppercase mb-4">
                      Benefícios diretos
                    </h4>
                    <ul className="space-y-3">
                      {addon.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm md:text-base text-white/70">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white/50 text-sm">USD</span>
                      <span className="text-4xl md:text-5xl font-bold">{addon.price}</span>
                      <span className="text-white/50 text-sm">/mês</span>
                    </div>
                    <LocaleLink 
                      href="/pricing"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-emerald-500 text-black hover:bg-emerald-400 glow-emerald-hover magnetic-button shine-effect"
                    >
                      {addon.cta}
                    </LocaleLink>
                  </div>
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
              Pronto para adicionar vantagens ao seu plano?
            </h2>
            <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-8 text-white/70">
              Escolha seu plano base e adicione os módulos que fazem sentido para o seu negócio
            </p>
            
            <LocaleLink 
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-emerald-500 text-black hover:bg-emerald-400 glow-emerald-hover magnetic-button shine-effect"
            >
              Ver planos
            </LocaleLink>
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
              <LocaleLink href="/" className="text-white/40 hover:text-white transition-colors text-sm">
                Home
              </LocaleLink>
              <LocaleLink href="/pricing" className="text-white/40 hover:text-white transition-colors text-sm">
                Pricing
              </LocaleLink>
              <Link href="/roi-calculator" className="text-white/40 hover:text-white transition-colors text-sm">
                ROI Calculator
              </LocaleLink>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
