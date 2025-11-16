import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Mail, MessageSquare, Calendar, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ContactPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('contact');

  const contactMethods = [
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      description: 'Envie um email e responderemos em até 24 horas',
      action: 'Enviar email',
      href: 'mailto:contato@loquia.com.br'
    },
    {
      id: 'chat',
      name: 'Chat ao vivo',
      icon: MessageSquare,
      description: 'Converse com nossa equipe em tempo real',
      action: 'Iniciar chat',
      href: '#'
    },
    {
      id: 'meeting',
      name: 'Agendar reunião',
      icon: Calendar,
      description: 'Agende uma demonstração personalizada',
      action: 'Agendar agora',
      href: '#'
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
              Vamos conversar sobre o seu crescimento
            </h1>
            <p className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-12 text-white/70 opacity-0 animate-fade-in-up animate-delay-200" style={{textWrap: 'balance'}}>
              Escolha a melhor forma de entrar em contato. Estamos prontos para ajudar você a multiplicar vendas sem desperdiçar orçamento
            </p>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* CONTACT METHODS */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 grid-stagger">
              {contactMethods.map((method, index) => (
                <div key={method.id} className="premium-card text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <method.icon className="w-8 h-8 text-emerald-500" />
                    </div>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3" style={{letterSpacing: '-0.01em'}}>
                    {method.name}
                  </h3>

                  <p className="text-sm md:text-base text-white/60 mb-8">
                    {method.description}
                  </p>

                  <a 
                    href={method.href}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 w-full"
                  >
                    {method.action}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* FAQ SECTION */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4" style={{letterSpacing: '-0.02em'}}>
                Perguntas frequentes
              </h2>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
                Respostas rápidas para dúvidas comuns
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="premium-card scroll-reveal tilt-on-hover">
                <h3 className="text-xl font-semibold mb-3">
                  Quanto tempo leva para implementar?
                </h3>
                <p className="text-white/60 text-sm md:text-base">
                  A integração com suas plataformas leva apenas alguns minutos. Você começa a ver insights no mesmo dia.
                </p>
              </div>

              <div className="premium-card scroll-reveal tilt-on-hover">
                <h3 className="text-xl font-semibold mb-3">
                  Preciso de conhecimento técnico?
                </h3>
                <p className="text-white/60 text-sm md:text-base">
                  Não. A plataforma foi desenhada para profissionais de marketing e gestores, sem necessidade de conhecimento técnico.
                </p>
              </div>

              <div className="premium-card scroll-reveal tilt-on-hover">
                <h3 className="text-xl font-semibold mb-3">
                  Posso cancelar a qualquer momento?
                </h3>
                <p className="text-white/60 text-sm md:text-base">
                  Sim. Não há fidelidade. Você pode cancelar quando quiser e seus dados ficam disponíveis para exportação.
                </p>
              </div>

              <div className="premium-card scroll-reveal tilt-on-hover">
                <h3 className="text-xl font-semibold mb-3">
                  Oferecem suporte em português?
                </h3>
                <p className="text-white/60 text-sm md:text-base">
                  Sim. Todo o suporte é feito em português por uma equipe especializada em marketing digital.
                </p>
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
              Pronto para começar?
            </h2>
            <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-8 text-white/70">
              Inicie agora e descubra como tornar cada campanha mais lucrativa
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href={`/${params.locale}/auth/sign-up`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-emerald-500 text-black hover:bg-emerald-400 glow-emerald-hover magnetic-button shine-effect"
              >
                Começar teste gratuito
              </Link>
              <Link 
                href={`/${params.locale}/pricing`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20"
              >
                Ver planos
              </Link>
            </div>
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
              <Link href={`/${params.locale}/pricing`} className="text-white/40 hover:text-white transition-colors text-sm">
                Pricing
              </Link>
              <Link href={`/${params.locale}/addons`} className="text-white/40 hover:text-white transition-colors text-sm">
                Addons
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
