'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavbarLinks() {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'pt';

  return (
    <nav className="hidden md:flex items-center gap-6">
      <Link 
        href={`/${locale}/pricing`} 
        className="text-sm text-white/70 hover:text-white transition-colors"
      >
        Pricing
      </Link>
      <Link 
        href={`/${locale}/addons`} 
        className="text-sm text-white/70 hover:text-white transition-colors"
      >
        Addons
      </Link>
      <Link 
        href={`/${locale}/contact`} 
        className="text-sm text-white/70 hover:text-white transition-colors"
      >
        Contact
      </Link>
    </nav>
  );
}
