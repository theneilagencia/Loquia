import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@loquia/ui';
import { MarketingShell } from '@/components/marketing/marketing-shell';

const SWATCHES = [
  'background',
  'foreground',
  'primary',
  'secondary',
  'accent',
  'muted',
  'destructive',
  'success',
  'warning',
  'border',
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
    <div className="container space-y-12 py-16">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('colors')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SWATCHES.map((name) => (
            <div key={name} className="space-y-1.5">
              <div
                className="h-16 rounded-md border border-border"
                style={{ backgroundColor: `hsl(var(--${name}))` }}
              />
              <p className="text-xs text-muted-foreground">--{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('typography')}</h2>
        <div className="space-y-2">
          <p className="text-4xl font-bold tracking-tight">Aa — Display</p>
          <p className="text-xl font-semibold">Aa — Heading</p>
          <p className="text-base">Aa — Body text</p>
          <p className="font-mono text-sm text-muted-foreground">Aa — Mono</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('components')}</h2>
        <Card>
          <CardHeader>
            <CardTitle>Buttons & badges</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Error</Badge>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
