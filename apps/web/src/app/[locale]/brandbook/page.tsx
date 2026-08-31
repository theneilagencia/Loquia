import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Badge, Button } from '@loquia/ui';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { LogoSymbol } from '@/components/brand/logo';

const PALETTE: { name: string; token: string; hex: string; border?: boolean }[] = [
  { name: 'Canvas', token: 'canvas', hex: '#F7F5F1', border: true },
  { name: 'Surface', token: 'surface', hex: '#FFFFFF', border: true },
  { name: 'Ink', token: 'ink', hex: '#1D1926' },
  { name: 'Iris', token: 'iris', hex: '#5B4AE6' },
  { name: 'Iris soft', token: 'iris-soft', hex: '#ECE9FF', border: true },
  { name: 'Sage', token: 'sage', hex: '#337965' },
  { name: 'Amber', token: 'amber', hex: '#9A6416' },
  { name: 'Danger', token: 'danger', hex: '#B13D4C' },
  { name: 'Track', token: 'track', hex: '#F1EFEA', border: true },
  { name: 'Muted', token: 'muted', hex: '#706A78' },
  { name: 'Border', token: 'border', hex: '#E4E0E7', border: true },
];

export default async function BrandbookPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <MarketingShell>
      <Brandbook />
    </MarketingShell>
  );
}

function Brandbook() {
  const t = useTranslations('brandbook');
  return (
    <main className="mx-auto max-w-[1000px] px-[clamp(20px,4vw,32px)] py-14">
      <div className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-iris">{t('title')}</div>
      <h1 className="mb-3 text-[clamp(30px,3.6vw,44px)] font-extrabold tracking-[-0.034em] text-ink">Loquia</h1>
      <p className="mb-11 max-w-[58ch] text-[17px] leading-relaxed text-muted-foreground">{t('subtitle')}</p>

      {/* Symbol */}
      <section className="mb-6 rounded-xl border border-border bg-surface p-[clamp(24px,3vw,40px)] shadow-card">
        <div className="mb-7 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Symbol</div>
        <div className="flex flex-wrap items-center gap-12">
          <LogoSymbol className="h-[88px] w-[88px] text-ink" />
          <div className="flex items-center gap-3 text-ink">
            <LogoSymbol className="h-[34px] w-[46px] shrink-0" />
            <span className="text-[38px] font-extrabold tracking-[-0.04em]">Loquia</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-inverse-surface px-[30px] py-6 text-inverse-fg">
            <LogoSymbol className="h-[30px] w-[40px] shrink-0" />
            <span className="text-[32px] font-extrabold tracking-[-0.04em]">Loquia</span>
          </div>
        </div>
        <p className="mt-7 max-w-[66ch] text-[14.5px] leading-relaxed text-muted-foreground">
          Three dispersed signals resolving into a single direction, ending in a solid dot. Never a
          microphone, speech balloon, brain, robot or sparkle.
        </p>
      </section>

      {/* Palette */}
      <section className="mb-6 rounded-xl border border-border bg-surface p-[clamp(24px,3vw,40px)] shadow-card">
        <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t('colors')}</div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-3.5">
          {PALETTE.map((c) => (
            <div key={c.token} className="overflow-hidden rounded-xl border border-border">
              <div
                className={c.border ? 'h-[66px] border-b border-border' : 'h-[66px]'}
                style={{ backgroundColor: `rgb(var(--${c.token}))` }}
              />
              <div className="px-3.5 py-3">
                <div className="text-[13.5px] font-semibold text-ink">{c.name}</div>
                <div className="mt-[3px] font-mono text-[11.5px] text-faint">{c.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Type + Components */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6">
        <section className="rounded-xl border border-border bg-surface p-[clamp(24px,3vw,40px)] shadow-card">
          <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {t('typography')}
          </div>
          <div className="text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">Manrope</div>
          <div className="mt-1.5 text-sm text-muted-foreground">400 · 500 · 600 · 700 · 800</div>
          <div className="mt-[30px] font-mono text-[26px] text-ink">Geist Mono</div>
          <div className="mt-1.5 text-sm text-muted-foreground">Labels, metadata, timestamps</div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-[clamp(24px,3vw,40px)] shadow-card">
          <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {t('components')}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Error</Badge>
          </div>
        </section>
      </div>
    </main>
  );
}
