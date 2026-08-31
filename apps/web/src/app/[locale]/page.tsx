import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Check,
  FileText,
  Languages,
  Layers,
  Lock,
  Mic,
  Quote,
  Sparkles,
  Workflow,
} from 'lucide-react';
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

const INTEGRATIONS = ['ChatGPT', 'Claude', 'Cursor', 'Notion', 'Obsidian', 'Gemini'];

function Marketing() {
  const t = useTranslations('marketing');
  const nav = useTranslations('nav');

  const steps = [
    { icon: Mic, title: t('stepTitle1'), body: t('howStep1') },
    { icon: Sparkles, title: t('stepTitle2'), body: t('howStep2') },
    { icon: FileText, title: t('stepTitle3'), body: t('howStep3') },
  ];

  const features = [
    { icon: Quote, title: t('evidenceTitle'), body: t('evidenceBody') },
    { icon: FileText, title: t('aiPackTitle'), body: t('aiPackBody') },
    { icon: Languages, title: t('originalLangTitle'), body: t('originalLangBody') },
    { icon: Layers, title: t('presetsTitle'), body: t('presetsBody') },
    { icon: Workflow, title: t('portabilityTitle'), body: t('portabilityBody') },
    { icon: Lock, title: t('privacyTitle'), body: t('privacyBody') },
  ];

  const presets = [
    { name: t('presetName1'), body: t('presetBody1'), accent: true },
    { name: t('presetName2'), body: t('presetBody2') },
    { name: t('presetName3'), body: t('presetBody3') },
    { name: t('presetName4'), body: t('presetBody4') },
    { name: t('presetName5'), body: t('presetBody5') },
  ];

  const packSections = [
    { k: t('packSec1K'), v: t('packSec1V'), q: t('packSec1Q'), ts: t('packSec1T'), tone: 'sage' as const },
    { k: t('packSec2K'), v: t('packSec2V'), q: t('packSec2Q'), ts: t('packSec2T'), tone: 'iris' as const },
    { k: t('packSec3K'), v: t('packSec3V'), q: t('packSec3Q'), ts: t('packSec3T'), tone: 'amber' as const },
    { k: t('packSec4K'), v: t('packSec4V'), q: null, ts: null, tone: 'iris' as const },
  ];

  return (
    <>
      {/* Hero — left-aligned, two-column */}
      <section
        className="container grid items-center gap-[clamp(28px,4vw,56px)] pb-14 pt-[clamp(44px,7vw,92px)] md:grid-cols-2"
        style={{ animation: 'loq-rise .5s cubic-bezier(.2,.7,.3,1) both' }}
      >
        <div>
          <div className="mb-6 font-mono text-xs uppercase tracking-[0.14em] text-iris">{t('eyebrow')}</div>
          <h1 className="max-w-[16ch] text-[clamp(36px,5vw,64px)] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink">
            {t('heroTitle')}
          </h1>
          <p className="mt-7 max-w-[56ch] text-[clamp(16px,1.5vw,19px)] leading-relaxed text-muted-foreground">
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
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5">
            {[t('trust1'), t('trust2'), t('trust3')].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[13.5px] text-muted-foreground">
                <Check className="size-4 text-sage" />
                {item}
              </li>
            ))}
          </ul>
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

      {/* Works-with strip */}
      <section className="border-y border-border bg-surface/50">
        <div className="container flex flex-col items-center gap-5 py-7 sm:flex-row sm:justify-between">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-faint">{t('worksWith')}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            {INTEGRATIONS.map((name) => (
              <span key={name} className="text-[15px] font-semibold tracking-[-0.01em] text-muted-foreground">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem — raw transcript vs AI Pack contrast */}
      <section className="container py-[clamp(56px,8vw,92px)]">
        <h2 className="mb-3 max-w-[20ch] text-[clamp(26px,3.2vw,40px)] font-extrabold leading-[1.1] tracking-[-0.032em] text-ink">
          {t('problemTitle')}
        </h2>
        <p className="mb-9 max-w-[58ch] text-[16.5px] leading-relaxed text-muted-foreground">{t('problemBody')}</p>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col rounded-xl border border-border bg-surface p-7">
            <div className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted-foreground">
              {t('rawTranscriptLabel')}
            </div>
            <p className="flex-1 font-mono text-[12.5px] leading-[1.8] text-faint">{t('rawSample')}</p>
            <div className="mt-5 border-t border-border pt-4 text-sm font-semibold text-danger">{t('rawResult')}</div>
          </div>
          <div className="flex flex-col rounded-xl bg-inverse-surface p-7 text-inverse-fg shadow-elevate">
            <div className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.1em] text-inverse-fg/50">{t('aiPackTitle')}</div>
            <p className="flex-1 whitespace-pre-line font-mono text-[12.5px] leading-[1.9] text-inverse-fg/90">{t('aiPackBody')}</p>
            <div className="mt-5 border-t border-inverse-fg/15 pt-4 text-sm font-semibold text-sage">{t('packResult')}</div>
          </div>
        </div>
      </section>

      {/* AI Pack showcase — the centerpiece product preview */}
      <section className="border-y border-border bg-surface/40">
        <div className="container grid items-center gap-[clamp(28px,4vw,56px)] py-[clamp(56px,8vw,96px)] lg:grid-cols-[0.85fr_1fr]">
          <div>
            <div className="mb-5 font-mono text-xs uppercase tracking-[0.14em] text-iris">{t('packEyebrow')}</div>
            <h2 className="max-w-[16ch] text-[clamp(26px,3.2vw,40px)] font-extrabold leading-[1.1] tracking-[-0.032em] text-ink">
              {t('packTitle')}
            </h2>
            <p className="mt-6 max-w-[46ch] text-[16.5px] leading-relaxed text-muted-foreground">{t('packLead')}</p>
            <Link href="/product" className={`mt-8 ${buttonVariants({ variant: 'outline' })}`}>
              {t('heroCtaSecondary')} <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Mock AI Pack document */}
          <div
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-modal"
            style={{ animation: 'loq-rise .6s cubic-bezier(.2,.7,.3,1) both .08s' }}
          >
            <div className="flex items-center gap-3 border-b border-border bg-canvas/60 px-5 py-3.5">
              <span className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-danger/60" />
                <span className="size-2.5 rounded-full bg-amber/60" />
                <span className="size-2.5 rounded-full bg-sage/60" />
              </span>
              <div className="ml-1 min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">{t('packDocTitle')}</p>
              </div>
              <span className="ml-auto font-mono text-[11px] text-faint">{t('packDocMeta')}</span>
            </div>
            <div className="divide-y divide-border">
              {packSections.map((s) => (
                <div key={s.k} className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-1.5 rounded-full ${
                        s.tone === 'sage' ? 'bg-sage' : s.tone === 'amber' ? 'bg-amber' : 'bg-iris'
                      }`}
                    />
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{s.k}</span>
                  </div>
                  <p className="mt-2 text-[14.5px] font-medium leading-snug text-ink">{s.v}</p>
                  {s.q && (
                    <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-canvas px-3 py-2">
                      <Quote className="mt-0.5 size-3.5 flex-none text-iris" />
                      <p className="text-[12.5px] italic leading-snug text-muted-foreground">{s.q}</p>
                      <span className="ml-auto flex-none font-mono text-[11px] text-faint">{s.ts}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works — three substantial steps */}
      <section className="container py-[clamp(56px,8vw,92px)]">
        <div className="mb-9 font-mono text-xs uppercase tracking-[0.14em] text-iris">{t('stepEyebrow')}</div>
        <h2 className="mb-10 max-w-[18ch] text-[clamp(26px,3.2vw,40px)] font-extrabold tracking-[-0.032em] text-ink">
          {t('howTitle')}
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-xl border border-border bg-surface p-7 transition-all hover:-translate-y-[3px] hover:shadow-elevate"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-lg bg-iris-soft text-iris">
                  <step.icon className="size-5" />
                </span>
                <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-5 text-[19px] font-bold tracking-[-0.02em] text-ink">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-y border-border bg-surface/40">
        <div className="container py-[clamp(56px,8vw,92px)]">
          <div className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-iris">{t('featuresEyebrow')}</div>
          <h2 className="mb-10 max-w-[20ch] text-[clamp(26px,3.2vw,40px)] font-extrabold tracking-[-0.032em] text-ink">
            {t('featuresTitle')}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-surface p-6">
                <span className="grid size-10 place-items-center rounded-lg bg-iris-soft text-iris">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mb-1.5 mt-4 text-[17px] font-bold tracking-[-0.015em] text-ink">{f.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Presets */}
      <section className="container py-[clamp(56px,8vw,92px)]">
        <div className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-iris">{t('presetsEyebrow')}</div>
        <h2 className="mb-3 max-w-[18ch] text-[clamp(26px,3.2vw,40px)] font-extrabold tracking-[-0.032em] text-ink">
          {t('presetsTitle')}
        </h2>
        <p className="mb-9 max-w-[56ch] text-[16.5px] text-muted-foreground">{t('presetsBody')}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl border p-5 transition-all hover:-translate-y-[3px] hover:shadow-card ${
                p.accent ? 'border-iris-line bg-iris-soft/40' : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold tracking-[-0.015em] text-ink">{p.name}</span>
                {p.accent && (
                  <span className="rounded-full bg-iris px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-white">
                    default
                  </span>
                )}
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
          <div className="flex flex-wrap content-center gap-2 rounded-xl border border-dashed border-border bg-transparent p-5">
            {['Markdown', 'JSON', 'TXT'].map((fmt) => (
              <span
                key={fmt}
                className="rounded-lg border border-border bg-surface px-3 py-[7px] font-mono text-[12.5px] text-muted-foreground"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Portability + privacy — balanced two-column band */}
      <section className="border-t border-border bg-surface/40">
        <div className="container grid items-center gap-[clamp(28px,4vw,56px)] py-[clamp(56px,8vw,92px)] md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-[clamp(24px,2.8vw,34px)] font-extrabold tracking-[-0.03em] text-ink">
              {t('portabilityTitle')}
            </h2>
            <p className="mb-7 max-w-[46ch] text-base leading-relaxed text-muted-foreground">{t('portabilityBody')}</p>
            <ul className="grid gap-2.5">
              {[t('portPoint1'), t('portPoint2'), t('portPoint3'), t('portPoint4')].map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5"
                >
                  <span className="grid size-6 flex-none place-items-center rounded-md bg-sage-soft text-sage">
                    <Check className="size-3.5" />
                  </span>
                  <span className="text-[14.5px] font-medium text-ink">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-track shadow-card">
            <Image
              src="/images/portability.png"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 560px"
              className="object-cover [object-position:50%_32%]"
            />
          </div>
        </div>
      </section>

      {/* Final CTA — dark band, centered closing moment */}
      <section className="container py-[clamp(56px,8vw,96px)]">
        <div className="relative overflow-hidden rounded-[24px] bg-inverse-surface px-[clamp(24px,5vw,72px)] py-[clamp(52px,8vw,96px)] text-center text-inverse-fg shadow-modal">
          {/* Ambient glows + subtle dot grid for depth */}
          <div className="pointer-events-none absolute -right-28 -top-28 size-80 rounded-full bg-iris/30 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-iris/15 blur-3xl" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            aria-hidden
            style={{
              backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="relative mx-auto flex max-w-[640px] flex-col items-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-inverse-fg/15 bg-inverse-fg/5 px-3.5 py-1.5">
              <Sparkles className="size-3.5 text-iris-strong" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-inverse-fg/70">{t('ctaEyebrow')}</span>
            </div>
            <h2 className="max-w-[18ch] text-[clamp(28px,4vw,48px)] font-extrabold leading-[1.05] tracking-[-0.035em]">
              {t('ctaTitle')}
            </h2>
            <p className="mt-5 max-w-[52ch] text-[clamp(15px,1.6vw,18px)] leading-relaxed text-inverse-fg/70">{t('ctaBody')}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/request-access" className={buttonVariants({ size: 'lg' })}>
                {t('ctaButton')} <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-lg border border-inverse-fg/25 bg-transparent px-5 py-3 text-sm font-semibold text-inverse-fg transition-colors hover:border-inverse-fg/60 hover:bg-inverse-fg/5"
              >
                {nav('login')}
              </Link>
            </div>
            <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
              {[t('trust1'), t('trust2'), t('trust3')].map((item) => (
                <li key={item} className="flex items-center gap-2 text-[13px] text-inverse-fg/60">
                  <Check className="size-4 text-sage" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
