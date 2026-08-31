'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/logo';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';

export function SiteHeader() {
  const t = useTranslations('nav');
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/85 backdrop-blur-[14px]">
      <div className="container flex flex-wrap items-center gap-6 py-4">
        <Link href="/" aria-label="Loquia">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-[22px] text-[14.5px] font-medium text-muted-foreground md:flex">
          <Link href="/product" className="transition-colors hover:text-foreground">
            {t('product')}
          </Link>
        </nav>
        <div className="flex-1" />
        <div className="hidden sm:block">
          <LocaleSwitcher />
        </div>
        <Link
          href="/login"
          className="inline-flex items-center rounded-lg border border-border-strong bg-surface px-[15px] py-[9px] text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-canvas"
        >
          {t('login')}
        </Link>
        <Link
          href="/request-access"
          className="inline-flex items-center rounded-lg bg-inverse-surface px-[15px] py-[9px] text-sm font-semibold text-inverse-fg transition-colors hover:bg-ink-hover"
        >
          {t('requestAccess')}
        </Link>
      </div>
    </header>
  );
}
