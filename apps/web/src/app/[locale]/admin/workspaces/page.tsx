'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Skeleton } from '@loquia/ui';
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
    <div>
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Loquia · Admin</div>
      <h1 className="mb-6 text-[clamp(23px,2.5vw,30px)] font-bold tracking-[-0.03em] text-ink">{t('workspaces')}</h1>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          {(data ?? []).map((w) => (
            <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-3.5 transition-colors hover:bg-canvas">
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-semibold tracking-[-0.008em] text-ink">{w.name}</p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
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
      </div>
    </div>
  );
}
