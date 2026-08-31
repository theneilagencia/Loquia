'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';

export default function AdminOverviewPage() {
  const t = useTranslations('admin');
  const services = useServices();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => services.admin.overview(),
  });

  const metrics = [
    { key: 'pendingRequests', value: data?.pendingRequests, accent: true },
    { key: 'activeUsers', value: data?.activeUsers },
    { key: 'workspaces', value: data?.workspaces },
    { key: 'meetings30d', value: data?.meetingsLast30Days },
    { key: 'openInvitations', value: data?.openInvitations, accent: true },
  ];

  return (
    <div>
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Loquia · Admin</div>
      <h1 className="text-[clamp(23px,2.5vw,30px)] font-bold tracking-[-0.03em] text-ink">{t('overview')}</h1>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(130px,100%),1fr))] gap-px overflow-hidden rounded-xl border border-border bg-border">
        {metrics.map((m) => (
          <div key={m.key} className="bg-surface px-[18px] py-4">
            <div className="font-mono text-[11px] uppercase leading-[1.3] tracking-[0.14em] text-faint">
              {t(`metrics.${m.key}`)}
            </div>
            {isLoading ? (
              <Skeleton className="mt-[7px] h-7 w-12" />
            ) : (
              <div
                className={`mt-[7px] text-[22px] font-bold tracking-[-0.025em] ${
                  m.accent && (m.value ?? 0) > 0 ? 'text-iris' : 'text-ink'
                }`}
              >
                {m.value ?? 0}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
