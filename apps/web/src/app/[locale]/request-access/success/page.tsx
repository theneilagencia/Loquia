import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { buttonVariants, Card, CardContent } from '@loquia/ui';
import { Link } from '@/i18n/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';

export default async function RequestAccessSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <MarketingShell>
      <Success />
    </MarketingShell>
  );
}

function Success() {
  const t = useTranslations('access');
  return (
    <div className="container flex max-w-lg flex-col items-center py-24 text-center">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <CheckCircle2 className="size-12 text-success" />
          <h1 className="text-2xl font-semibold">{t('successTitle')}</h1>
          <p className="text-muted-foreground">{t('successBody')}</p>
          <Link href="/" className={buttonVariants({ variant: 'outline' })}>
            {t('successBack')}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
