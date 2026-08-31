import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { PACK_SECTION_KEYS, PACK_SECTION_TITLE } from '@loquia/domain';
import { MarketingShell } from '@/components/marketing/marketing-shell';

export default async function ProductPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <MarketingShell>
      <Product />
    </MarketingShell>
  );
}

function Product() {
  const t = useTranslations('marketing');
  const a = useTranslations('aiPack');
  return (
    <>
      {/* Header */}
      <section className="container pb-[clamp(48px,7vw,80px)] pt-[clamp(48px,7vw,88px)]">
        <div className="mb-6 font-mono text-xs uppercase tracking-[0.14em] text-iris">{t('eyebrow')}</div>
        <h1 className="max-w-[18ch] text-[clamp(30px,3.6vw,44px)] font-extrabold tracking-[-0.034em] text-ink">
          {t('aiPackTitle')}
        </h1>
        <p className="mt-6 max-w-[58ch] text-[clamp(16px,1.5vw,19px)] leading-relaxed text-muted-foreground">
          {t('aiPackBody')}
        </p>
      </section>

      {/* Canonical sections */}
      <section className="container pb-[clamp(56px,8vw,88px)]">
        <div className="mb-[26px] font-mono text-[11.5px] uppercase tracking-[0.12em] text-muted-foreground">
          {a('title')}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PACK_SECTION_KEYS.map((key, i) => (
            <div
              key={key}
              className="rounded-xl border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-[2px] hover:shadow-elevate"
            >
              <div className="font-mono text-[11px] text-iris">{String(i + 1).padStart(2, '0')}</div>
              <div className="mt-2 text-[15px] font-semibold text-ink">{PACK_SECTION_TITLE[key]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature trio */}
      <section className="container pb-[clamp(56px,8vw,88px)]">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature title={t('presetsTitle')} body={t('presetsBody')} />
          <Feature title={t('portabilityTitle')} body={t('portabilityBody')} />
          <Feature title={t('privacyTitle')} body={t('privacyBody')} />
        </div>
      </section>

      {/* Evidence pipeline note */}
      <section className="container pb-[clamp(64px,9vw,100px)]">
        <div className="rounded-xl bg-inverse-surface p-[26px] text-inverse-fg">
          <div className="mb-2.5 font-mono text-[11.5px] uppercase tracking-[0.1em] text-inverse-fg/50">
            {a('evidence')}
          </div>
          <p className="font-mono text-[13.5px] text-inverse-fg">TranscriptSegment → AIPack → ExportEngine</p>
        </div>
      </section>
    </>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-7 shadow-card">
      <h2 className="text-[19px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
      <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
