import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@loquia/ui';
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

      {/* Problem — raw transcript vs AI Pack contrast (design canvas) */}
      <section className="container pb-[clamp(56px,8vw,88px)]">
        <h2 className="mb-3 max-w-[20ch] text-[clamp(26px,3.2vw,40px)] font-extrabold leading-[1.1] tracking-[-0.032em] text-ink">
          {t('problemTitle')}
        </h2>
        <p className="mb-8 max-w-[58ch] text-[16.5px] leading-relaxed text-muted-foreground">{t('problemBody')}</p>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-[26px]">
            <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted-foreground">
              {t('rawTranscriptLabel')}
            </div>
            <p className="font-mono text-[12.5px] leading-[1.7] text-faint">{t('rawSample')}</p>
            <div className="mt-4 border-t border-border pt-3.5 text-sm font-semibold text-danger">
              {t('rawResult')}
            </div>
          </div>
          <div className="rounded-xl bg-inverse-surface p-[26px] text-inverse-fg">
            <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-[0.1em] text-inverse-fg/50">
              {t('aiPackTitle')}
            </div>
            <p className="whitespace-pre-line font-mono text-[12.5px] leading-[1.8] text-inverse-fg">
              {t('aiPackBody')}
            </p>
            <div className="mt-4 border-t border-inverse-fg/15 pt-3.5 text-sm font-semibold text-sage">
              {t('packResult')}
            </div>
          </div>
        </div>
      </section>

      {/* How it works — numbered cards */}
      <section className="container pb-[clamp(56px,8vw,88px)]">
        <h2 className="mb-[30px] text-[clamp(26px,3.2vw,40px)] font-extrabold tracking-[-0.032em] text-ink">
          {t('howTitle')}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {[t('howStep1'), t('howStep2'), t('howStep3')].map((step, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-7 transition-all hover:-translate-y-[3px] hover:shadow-elevate"
            >
              <div className="font-mono text-xs text-iris">{String(i + 1).padStart(2, '0')}</div>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Formats / presets */}
      <section className="container pb-[clamp(56px,8vw,88px)]">
        <h2 className="mb-3 text-[clamp(26px,3.2vw,40px)] font-extrabold tracking-[-0.032em] text-ink">
          {t('presetsTitle')}
        </h2>
        <p className="mb-[30px] max-w-[56ch] text-[16.5px] text-muted-foreground">{t('presetsBody')}</p>
        <div className="flex flex-wrap gap-2">
          {['Markdown', 'JSON', 'Cursor', 'Claude Projects', 'Notion'].map((label) => (
            <span
              key={label}
              className="rounded-lg border border-border bg-surface px-3 py-[7px] font-mono text-[12.5px] text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Open / portability + privacy */}
      <section className="container pb-[clamp(64px,9vw,100px)]">
        <div className="grid items-stretch gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-[clamp(24px,2.8vw,34px)] font-extrabold tracking-[-0.03em] text-ink">
              {t('portabilityTitle')}
            </h2>
            <p className="mb-5 max-w-[46ch] text-base leading-relaxed text-muted-foreground">
              {t('portabilityBody')}
            </p>
            <div className="grid gap-2.5">
              <div className="flex flex-wrap items-baseline gap-3.5 rounded-xl border border-border bg-surface px-[18px] py-4">
                <span className="min-w-[130px] text-[14.5px] font-bold text-ink">{t('privacyTitle')}</span>
                <span className="min-w-[180px] flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t('privacyBody')}
                </span>
              </div>
            </div>
          </div>
          <div className="min-h-[340px] overflow-hidden rounded-xl bg-track shadow-card">
            <Image
              src="/images/portability.png"
              alt=""
              width={1200}
              height={800}
              className="h-full w-full object-cover [object-position:50%_32%]"
            />
          </div>
        </div>

        {/* Final CTA banner */}
        <div className="relative mt-16 flex min-h-[320px] flex-wrap items-end justify-between gap-6 overflow-hidden rounded-2xl p-[clamp(30px,4vw,52px)]">
          <Image src="/images/cta-background.png" alt="" fill className="object-cover [object-position:58%_55%]" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(100deg, rgba(14,12,19,.82) 0%, rgba(14,12,19,.52) 48%, rgba(14,12,19,.12) 100%)',
            }}
          />
          <div className="relative max-w-[34ch]">
            <div className="text-[clamp(22px,2.6vw,30px)] font-extrabold tracking-[-0.03em] text-[#F7F5F1]">
              {t('ctaTitle')}
            </div>
            <div className="mt-2.5 text-[15px] leading-relaxed text-[rgba(247,245,241,0.72)]">{t('ctaBody')}</div>
          </div>
          <Link href="/request-access" className={`relative ${buttonVariants({ size: 'lg' })}`}>
            {t('ctaButton')} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
