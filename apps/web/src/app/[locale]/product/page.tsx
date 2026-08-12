import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle } from '@loquia/ui';
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
    <div className="container space-y-16 py-16">
      <header className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t('aiPackTitle')}</h1>
        <p className="text-lg text-muted-foreground">{t('aiPackBody')}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PACK_SECTION_KEYS.map((key) => (
          <Card key={key}>
            <CardHeader className="p-4">
              <CardTitle className="text-sm">{PACK_SECTION_TITLE[key]}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-8 md:grid-cols-3">
        <Feature title={t('presetsTitle')} body={t('presetsBody')} />
        <Feature title={t('portabilityTitle')} body={t('portabilityBody')} />
        <Feature title={t('privacyTitle')} body={t('privacyBody')} />
      </section>

      <p className="text-sm text-muted-foreground">{a('evidence')} · TranscriptSegment → AIPack → ExportEngine</p>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground">{body}</p>
    </div>
  );
}
