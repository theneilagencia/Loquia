import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/logo';

export function SiteFooter() {
  const t = useTranslations('nav');
  const c = useTranslations('common');
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Logo />
          <p className="text-sm text-muted-foreground">{c('tagline')}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/product" className="hover:text-foreground">
            {t('product')}
          </Link>
          <Link href="/security" className="hover:text-foreground">
            {t('security')}
          </Link>
          <Link href="/brandbook" className="hover:text-foreground">
            {t('brandbook')}
          </Link>
          <Link href="/request-access" className="hover:text-foreground">
            {t('requestAccess')}
          </Link>
        </nav>
      </div>
      <div className="container pb-8 text-xs text-muted-foreground">
        © 2026 Loquia · Milestone 1 (mock mode)
      </div>
    </footer>
  );
}
