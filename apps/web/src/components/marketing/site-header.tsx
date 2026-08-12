'use client';

import { useTranslations } from 'next-intl';
import { buttonVariants } from '@loquia/ui';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';

export function SiteHeader() {
  const t = useTranslations('nav');
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Loquia">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/product" className="transition-colors hover:text-foreground">
            {t('product')}
          </Link>
          <Link href="/security" className="transition-colors hover:text-foreground">
            {t('security')}
          </Link>
          <Link href="/brandbook" className="transition-colors hover:text-foreground">
            {t('brandbook')}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            {t('login')}
          </Link>
          <Link href="/request-access" className={buttonVariants({ size: 'sm' })}>
            {t('requestAccess')}
          </Link>
        </div>
      </div>
    </header>
  );
}
