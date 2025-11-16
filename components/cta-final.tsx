'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CTAFinalProps {
  buttonText: string;
}

export function CTAFinal({ buttonText }: CTAFinalProps) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'pt';

  return (
    <Link 
      href={`/${locale}/pricing`} 
      className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg rounded-lg font-medium transition-all duration-200 bg-emerald-500 text-black hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black"
      style={{boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'}}
    >
      {buttonText}
    </Link>
  );
}
