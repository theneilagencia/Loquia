'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, CardContent, Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';

export default function AdminWorkspacesPage() {
  const t = useTranslations('admin');
  const m = useTranslations('meetings');
  const services = useServices();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'workspaces'],
    queryFn: () => services.admin.listWorkspaces(),
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('workspaces')}</h1>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {(data ?? []).map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{w.name}</p>
                <p className="text-sm text-muted-foreground">
                  {w.slug} · {w.plan} · {w.seats} seats
                </p>
              </div>
              <div className="flex items-center gap-2">
                {w.archived ? (
                  <Badge variant="outline">{m('status.archived')}</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const actor = (await services.auth.getSession())?.user.id ?? 'u1';
                      await services.admin.archiveWorkspace(w.id, actor);
                      refetch();
                    }}
                  >
                    {m('archive')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
