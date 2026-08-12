'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, CardContent, Skeleton } from '@loquia/ui';
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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('users')}</h1>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {(data ?? []).map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{u.name}</p>
                <p className="truncate text-sm text-muted-foreground">{u.email}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
