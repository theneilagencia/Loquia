import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Lock, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@loquia/ui';
import { MarketingShell } from '@/components/marketing/marketing-shell';

export default async function SecurityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <MarketingShell>
      <Security />
    </MarketingShell>
  );
}

function Security() {
  const t = useTranslations('marketing');
  const items = [
    { icon: Lock, title: t('privacyTitle'), body: t('privacyBody') },
    { icon: Trash2, title: 'Áudio descartável', body: t('portabilityBody') },
    { icon: UserCheck, title: 'Acesso controlado', body: 'Convites e aprovação por admin, com auditoria de cada ação.' },
    { icon: ShieldCheck, title: 'Portável', body: t('portabilityBody') },
  ];
  return (
    <div className="container space-y-12 py-16">
      <header className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t('privacyTitle')}</h1>
        <p className="text-lg text-muted-foreground">{t('privacyBody')}</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2">
        {items.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardContent className="flex gap-4 pt-6">
              <Icon className="size-6 shrink-0 text-primary" />
              <div>
                <h2 className="mb-1 font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
