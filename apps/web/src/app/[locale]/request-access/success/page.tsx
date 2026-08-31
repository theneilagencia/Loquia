import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { buttonVariants } from '@loquia/ui';
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
    <div
      className="mx-auto w-full max-w-[560px] px-5 pb-[110px] pt-[clamp(48px,8vw,96px)]"
      style={{ animation: 'loq-rise .5s cubic-bezier(.2,.7,.3,1) both' }}
    >
      <div className="rounded-xl border border-sage/40 bg-surface p-8 shadow-card">
        <div className="grid size-11 place-items-center rounded-full bg-sage-soft text-sage">
          <CheckCircle2 className="size-6" />
        </div>
        <h1 className="mt-5 text-[22px] font-extrabold tracking-[-0.02em] text-ink">{t('successTitle')}</h1>
        <p className="mt-2 max-w-[58ch] text-[15px] leading-relaxed text-muted-foreground">
          {t('successBody')}
        </p>
        <Link href="/" className={`${buttonVariants({ variant: 'outline' })} mt-6`}>
          {t('successBack')}
        </Link>
      </div>
    </div>
  );
}
