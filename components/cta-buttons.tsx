'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CTAButtonsProps {
  cta1Text: string;
  cta2Text: string;
  cta3Text: string;
}

export function CTAButtons({ cta1Text, cta2Text, cta3Text }: CTAButtonsProps) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'pt';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up animate-delay-400">
      <Link 
        href={`/${locale}/pricing`} 
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-emerald-500 text-black hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black glow-emerald-hover magnetic-button shine-effect"
      >
        {cta1Text}
      </Link>
      <Link 
        href={`/${locale}/pricing`} 
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black"
      >
        {cta2Text}
      </Link>
      <Link 
        href={`/${locale}/roi-calculator`} 
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 text-white/70 hover:text-white hover:bg-white/5"
      >
        {cta3Text}
      </Link>
    </div>
  );
}
