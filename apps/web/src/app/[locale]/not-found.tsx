'use client';

import { useTranslations } from 'next-intl';
import { buttonVariants } from '@loquia/ui';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('errors');
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">{t('notFoundTitle')}</h1>
      <p className="text-muted-foreground">{t('notFoundBody')}</p>
      <Link href="/" className={buttonVariants({ variant: 'outline' })}>
        Loquia
      </Link>
    </div>
  );
}
