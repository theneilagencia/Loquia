'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { formatDate } from '@/lib/format';

export default function AdminAuditPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const services = useServices();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: () => services.admin.listAudit(1, 50),
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div>
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Loquia · Admin</div>
      <h1 className="mb-6 text-[clamp(23px,2.5vw,30px)] font-bold tracking-[-0.03em] text-ink">{t('audit')}</h1>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {(data?.items ?? []).map((event) => (
          <div
            key={event.id}
            className="flex flex-wrap items-center gap-4 px-[18px] py-3 transition-colors hover:bg-canvas"
          >
            <span className="min-w-[82px] whitespace-nowrap font-mono text-[11.5px] text-faint">
              {formatDate(event.createdAt, locale)}
            </span>
            <span className="inline-block min-w-[104px] whitespace-nowrap rounded-md bg-track px-[7px] py-[3px] text-center font-mono text-[10.5px] uppercase tracking-[0.09em] text-muted-foreground">
              {event.action}
            </span>
            <span className="min-w-[200px] flex-1 truncate text-[13.5px] text-ink">
              {event.actorLabel} → {event.targetLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
