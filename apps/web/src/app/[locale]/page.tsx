import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight, FileText, Layers, Lock, Workflow } from 'lucide-react';
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
      {/* Hero — left-aligned, two-column (design handoff) */}
      <section
        className="container grid items-center gap-[clamp(28px,4vw,56px)] pb-16 pt-[clamp(48px,7vw,96px)] md:grid-cols-2"
        style={{ animation: 'loq-rise .5s cubic-bezier(.2,.7,.3,1) both' }}
      >
        <div>
          <div className="mb-6 font-mono text-xs uppercase tracking-[0.14em] text-iris">{t('eyebrow')}</div>
          <h1 className="max-w-[16ch] text-[clamp(36px,5vw,64px)] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink">
            {t('heroTitle')}
          </h1>
          <p className="mt-7 max-w-[58ch] text-[clamp(16px,1.5vw,19px)] leading-relaxed text-muted-foreground">
            {t('heroSubtitle')}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/request-access" className={buttonVariants({ size: 'lg' })}>
              {t('heroCtaPrimary')} <ArrowRight className="size-4" />
            </Link>
            <Link href="/product" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              {t('heroCtaSecondary')}
            </Link>
          </div>
          <p className="mt-4 text-[13.5px] text-muted-foreground">{t('accessNote')}</p>
        </div>
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-xl bg-iris-soft shadow-elevate"
          style={{ animation: 'loq-rise .6s cubic-bezier(.2,.7,.3,1) both .12s' }}
        >
          <Image
            src="/images/hero-recording.png"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 560px"
            className="object-cover [object-position:50%_22%]"
          />
          <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl bg-inverse-surface/70 px-4 py-3.5 backdrop-blur">
            <span className="size-2 flex-none rounded-full bg-danger" style={{ animation: 'loq-pulse 1.6s ease-in-out infinite' }} />
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-inverse-fg/70">{t('recordingLabel')}</span>
            <span className="flex-1" />
            <span className="font-mono text-[13px] text-inverse-fg">42:18</span>
          </div>
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
        <FeatureCard icon={FileText} title={t('aiPackTitle')} body={t('aiPackBody')} />
        <FeatureCard icon={Layers} title={t('presetsTitle')} body={t('presetsBody')} />
        <FeatureCard icon={Workflow} title={t('portabilityTitle')} body={t('portabilityBody')} />
        <FeatureCard icon={Lock} title={t('privacyTitle')} body={t('privacyBody')} />
      </section>

      {/* Portability */}
      <section className="container grid items-center gap-8 py-16 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight">{t('portabilityTitle')}</h2>
          <p className="text-lg text-muted-foreground">{t('portabilityBody')}</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border shadow-card">
          <Image src="/images/portability.png" alt="" width={1200} height={800} className="h-auto w-full" />
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <Card className="relative overflow-hidden border-0">
          <Image
            src="/images/cta-background.png"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-inverse-surface/70" />
          <CardContent className="relative flex flex-col items-center gap-5 py-16 text-center">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-inverse-fg">{t('ctaTitle')}</h2>
            <p className="max-w-lg text-inverse-fg/80">{t('ctaBody')}</p>
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
  icon: typeof FileText;
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
