'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';

export default function AdminOverviewPage() {
  const t = useTranslations('admin');
  const services = useServices();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => services.admin.overview(),
  });

  const metrics = [
    { key: 'pendingRequests', value: data?.pendingRequests },
    { key: 'activeUsers', value: data?.activeUsers },
    { key: 'workspaces', value: data?.workspaces },
    { key: 'meetings30d', value: data?.meetingsLast30Days },
    { key: 'openInvitations', value: data?.openInvitations },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('overview')}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.key}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{t(`metrics.${m.key}`)}</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-1 text-3xl font-semibold">{m.value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
