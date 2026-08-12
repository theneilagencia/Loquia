'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { Badge, Card, CardContent, Skeleton } from '@loquia/ui';
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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('accessRequests')}</h1>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {(data ?? []).map((req) => (
            <Link
              key={req.id}
              href={`/admin/access-requests/${req.id}`}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{req.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {req.email} · {req.company}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {formatDate(req.createdAt, locale)}
                </span>
                <Badge variant={STATUS_VARIANT[req.status]}>{t(STATUS_KEY[req.status])}</Badge>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
