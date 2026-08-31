'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { Badge, Skeleton } from '@loquia/ui';
import type { AccessRequestStatus } from '@loquia/domain';
import { useServices } from '@/lib/services-context';
import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';

const STATUS_VARIANT: Record<AccessRequestStatus, 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

const STATUS_KEY: Record<AccessRequestStatus, string> = {
  pending: 'request.pending',
  approved: 'request.statusApproved',
  rejected: 'request.statusRejected',
};

export default function AccessRequestsPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const services = useServices();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'access-requests'],
    queryFn: () => services.admin.listAccessRequests(),
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div>
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Loquia · Admin</div>
      <h1 className="mb-6 text-[clamp(23px,2.5vw,30px)] font-bold tracking-[-0.03em] text-ink">
        {t('accessRequests')}
      </h1>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {(data ?? []).map((req) => (
          <Link
            key={req.id}
            href={`/admin/access-requests/${req.id}`}
            className="flex flex-wrap items-center gap-4 px-[18px] py-3.5 transition-colors hover:bg-canvas"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-semibold tracking-[-0.008em] text-ink">{req.name}</p>
              <p className="mt-1 truncate text-[12.5px] text-muted-foreground">{req.email}</p>
            </div>
            <span className="min-w-[104px] text-[13.5px] text-ink">{req.company}</span>
            <span className="min-w-[92px]">
              <Badge variant={STATUS_VARIANT[req.status]}>{t(STATUS_KEY[req.status])}</Badge>
            </span>
            <span className="hidden whitespace-nowrap text-[12.5px] text-muted-foreground sm:block">
              {formatDate(req.createdAt, locale)}
            </span>
            <ChevronRight className="size-4 text-iris" />
          </Link>
        ))}
      </div>
    </div>
  );
}
