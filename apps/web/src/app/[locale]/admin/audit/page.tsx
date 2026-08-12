'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Skeleton } from '@loquia/ui';
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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('audit')}</h1>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {(data?.items ?? []).map((event) => (
            <div key={event.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-mono text-sm">{event.action}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {event.actorLabel} → {event.targetLabel}
                </p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(event.createdAt, locale)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
