import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Lock, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
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
    <>
      <section className="container pb-[clamp(48px,7vw,72px)] pt-[clamp(48px,7vw,88px)]">
        <div className="mb-6 font-mono text-xs uppercase tracking-[0.14em] text-iris">Security</div>
        <h1 className="max-w-[18ch] text-[clamp(30px,3.6vw,44px)] font-extrabold tracking-[-0.034em] text-ink">
          {t('privacyTitle')}
        </h1>
        <p className="mt-6 max-w-[58ch] text-[clamp(16px,1.5vw,19px)] leading-relaxed text-muted-foreground">
          {t('privacyBody')}
        </p>
      </section>

      <section className="container pb-[clamp(64px,9vw,100px)]">
        <div className="grid gap-6 sm:grid-cols-2">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-surface p-7 shadow-card">
              <div className="flex size-11 items-center justify-center rounded-lg bg-iris-soft text-iris">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-5 text-[17px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
