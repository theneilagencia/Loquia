import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';

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
    conclusion: t('problem.conclusion'),
  };

  const solution = {
    title: t('solution.title'),
    subtitle: t('solution.subtitle'),
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
          <Link href={`/${params.locale}`} className="text-xl font-bold">
            Loquia
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-16 md:pt-20">
        {/* HERO SECTION */}
        <section className="py-20 md:py-32 lg:py-40" style={{background: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)'}}>
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12 text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none mb-6" style={{letterSpacing: '-0.03em', textWrap: 'balance'}}>
              {hero.title}
            </h1>
            <p className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-12 text-white/70" style={{textWrap: 'balance'}}>
              {hero.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href={`/${params.locale}/pricing`} 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-emerald-500 text-black hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black"
                style={{boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'}}
              >
                {hero.cta1}
              </Link>
              <Link 
                href={`/${params.locale}/pricing`} 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black"
              >
                {hero.cta2}
              </Link>
              <Link 
                href={`/${params.locale}/roi-calculator`} 
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
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-4" style={{letterSpacing: '-0.02em'}}>
                {problem.title}
              </h2>
              <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto text-white/70">
                {problem.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
              {problem.items.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.15] hover:bg-white/[0.04]"
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

            <p className="text-lg md:text-xl leading-relaxed text-center text-red-400 font-medium">
              {problem.conclusion}
            </p>
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
              <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-6 text-white/70">
                {solution.subtitle}
              </p>
              <p className="text-base md:text-lg leading-relaxed max-w-3xl mx-auto text-white/65">
                {solution.intro}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {solution.benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-white/[0.03]"
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
                  className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.15] hover:bg-white/[0.04]"
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
                  className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 md:p-8 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.15] hover:bg-white/[0.04]"
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
                  className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 md:p-8 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.15] hover:bg-white/[0.04]"
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

        {/* STATS SECTION */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6 md:px-8 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-4" style={{letterSpacing: '-0.02em'}}>
                {stats.title}
              </h2>
              <p className="text-lg md:text-xl leading-relaxed text-white/70">
                {stats.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {stats.items.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center p-8 md:p-10 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.08] rounded-2xl"
                >
                  <div className="text-6xl font-bold text-emerald-500 mb-4">{stat.value}</div>
                  <p className="text-base md:text-lg leading-relaxed text-white/65">{stat.label}</p>
                </div>
              ))}
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
            
            <Link 
              href={`/${params.locale}/pricing`} 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg rounded-lg font-medium transition-all duration-200 bg-emerald-500 text-black hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black"
              style={{boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'}}
            >
              {cta.button}
            </Link>
            
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
              <Link href={`/${params.locale}/pricing`} className="text-white/60 hover:text-white transition-colors duration-200">
                Pricing
              </Link>
              <Link href={`/${params.locale}/addons`} className="text-white/60 hover:text-white transition-colors duration-200">
                Addons
              </Link>
              <Link href={`/${params.locale}/contact`} className="text-white/60 hover:text-white transition-colors duration-200">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
