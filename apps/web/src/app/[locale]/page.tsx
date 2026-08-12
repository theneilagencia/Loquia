import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight, FileJson, Layers, Lock, Sparkles, Workflow } from 'lucide-react';
import { buttonVariants, Card, CardContent } from '@loquia/ui';
import { Link } from '@/i18n/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <MarketingShell>
      <Marketing />
    </MarketingShell>
  );
}

function Marketing() {
  const t = useTranslations('marketing');
  return (
    <>
      {/* Hero */}
      <section className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" /> AI Pack · 14 seções canônicas
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t('heroTitle')}
        </h1>
        <p className="max-w-2xl text-pretty text-lg text-muted-foreground">{t('heroSubtitle')}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/request-access" className={buttonVariants({ size: 'lg' })}>
            {t('heroCtaPrimary')} <ArrowRight className="size-4" />
          </Link>
          <Link href="/product" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            {t('heroCtaSecondary')}
          </Link>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-border bg-muted/40">
        <div className="container grid gap-8 py-16 md:grid-cols-2 md:items-center">
          <h2 className="text-3xl font-semibold tracking-tight">{t('problemTitle')}</h2>
          <p className="text-lg text-muted-foreground">{t('problemBody')}</p>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20">
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight">{t('howTitle')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[t('howStep1'), t('howStep2'), t('howStep3')].map((step, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="mb-3 grid size-9 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                  {i + 1}
                </div>
                <p className="text-base">{step}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature blocks */}
      <section className="container grid gap-6 pb-8 md:grid-cols-2">
        <FeatureCard icon={Sparkles} title={t('aiPackTitle')} body={t('aiPackBody')} />
        <FeatureCard icon={Layers} title={t('presetsTitle')} body={t('presetsBody')} />
        <FeatureCard icon={Workflow} title={t('portabilityTitle')} body={t('portabilityBody')} />
        <FeatureCard icon={Lock} title={t('privacyTitle')} body={t('privacyBody')} />
      </section>

      {/* CTA */}
      <section className="container py-20">
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center gap-5 py-14 text-center">
            <FileJson className="size-10 text-primary" />
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight">{t('ctaTitle')}</h2>
            <p className="max-w-lg text-muted-foreground">{t('ctaBody')}</p>
            <Link href="/request-access" className={buttonVariants({ size: 'lg' })}>
              {t('ctaButton')} <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <Card>
      <CardContent className="flex gap-4 pt-6">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-accent/10 text-accent">
          <Icon className="size-5" />
        </div>
        <div>
          <h3 className="mb-1 text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}
