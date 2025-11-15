'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Remove o locale atual do pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    // Redireciona para o novo locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium uppercase">{locale}</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-32 bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <button
          onClick={() => switchLocale('pt')}
          className={`w-full text-left px-4 py-2 hover:bg-gray-700 rounded-t-lg transition-colors ${
            locale === 'pt' ? 'bg-gray-700 text-blue-400' : 'text-white'
          }`}
        >
          🇧🇷 Português
        </button>
        <button
          onClick={() => switchLocale('en')}
          className={`w-full text-left px-4 py-2 hover:bg-gray-700 rounded-b-lg transition-colors ${
            locale === 'en' ? 'bg-gray-700 text-blue-400' : 'text-white'
          }`}
        >
          🇺🇸 English
        </button>
      </div>
    </div>
  );
}
