'use client';

import { Link } from '@/navigation';

export function NavbarLinks() {
  return (
    <nav className="hidden md:flex items-center gap-6">
      <Link 
        href="/pricing" 
        className="text-sm text-white/70 hover:text-white transition-colors"
      >
        Ver planos
      </Link>
      <Link 
        href="/addons" 
        className="text-sm text-white/70 hover:text-white transition-colors"
      >
        Addons
      </Link>
      <Link 
        href="/contact" 
        className="text-sm text-white/70 hover:text-white transition-colors"
      >
        Contact
      </Link>
      <Link 
        href="/auth/login" 
        className="px-4 py-2 text-sm font-medium text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-emerald-400/20"
      >
        Login
      </Link>
    </nav>
  );
}
