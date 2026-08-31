'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const services = useServices();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => services.admin.listUsers(),
  });

  async function act(fn: () => Promise<unknown>) {
    await fn();
    refetch();
  }

  async function actor() {
    return (await services.auth.getSession())?.user.id ?? 'u1';
  }

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div>
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Loquia · Admin</div>
      <h1 className="mb-6 text-[clamp(23px,2.5vw,30px)] font-bold tracking-[-0.03em] text-ink">{t('users')}</h1>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          {(data ?? []).map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-3.5 transition-colors hover:bg-canvas">
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-semibold tracking-[-0.008em] text-ink">{u.name}</p>
                <p className="mt-1 truncate text-[12.5px] text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{t(`roles.${u.role}`)}</Badge>
                <Badge variant={u.status === 'active' ? 'success' : 'outline'}>{u.status}</Badge>
                {u.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void act(async () => services.admin.setUserStatus(u.id, 'suspended', await actor()))}
                  >
                    {t('userActions.suspend')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void act(async () => services.admin.setUserStatus(u.id, 'active', await actor()))}
                  >
                    {t('userActions.activate')}
                  </Button>
                )}
                {u.role === 'member' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void act(async () => services.admin.setUserRole(u.id, 'admin', await actor()))}
                  >
                    {t('userActions.makeAdmin')}
                  </Button>
                ) : (
                  u.role === 'admin' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void act(async () => services.admin.setUserRole(u.id, 'member', await actor()))}
                    >
                      {t('userActions.makeMember')}
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
