'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { GlowButton } from '@/components/glow';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LogOut, User } from 'lucide-react';

export function Navbar() {
  const t = useTranslations('navbar');
  const tAuth = useTranslations('auth');
  const { locale } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/sign-in`);
    router.refresh();
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={`/${locale}`} className="text-2xl font-bold text-white">
              Loquia
            </Link>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href={`/${locale}/campaigns`}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {t('campaigns')}
            </Link>
            <Link
              href={`/${locale}/setup`}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {t('setup')}
            </Link>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <button className="text-gray-300 hover:text-white p-2 rounded-md transition-colors">
              <User className="w-5 h-5" />
            </button>
            <GlowButton
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{tAuth('logout')}</span>
            </GlowButton>
          </div>
        </div>
      </div>
    </nav>
  );
}
