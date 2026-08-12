'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Badge, Button, Card, CardContent, Input, Skeleton } from '@loquia/ui';
import { inviteUserSchema, type InviteUserInput } from '@loquia/contracts';
import type { InvitationStatus } from '@loquia/domain';
import { useServices } from '@/lib/services-context';
import { FieldError } from '@/components/ui/field-error';

const VARIANT: Record<InvitationStatus, 'success' | 'secondary' | 'outline' | 'destructive'> = {
  sent: 'secondary',
  accepted: 'success',
  expired: 'outline',
  revoked: 'destructive',
};

export default function AdminInvitationsPage() {
  const t = useTranslations('admin');
  const services = useServices();
  const [message, setMessage] = useState<string | null>(null);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'invitations'],
    queryFn: () => services.admin.listInvitations(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { role: 'member' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const actor = (await services.auth.getSession())?.user.id ?? 'u1';
    const result = await services.admin.createInvitation(actor, values);
    if (result.ok) {
      setMessage(t('invite.sent'));
      reset({ email: '', role: 'member' });
      refetch();
    }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('invitations')}</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1 space-y-1.5">
              <label className="text-sm font-medium">{t('invite.email')}</label>
              <Input type="email" {...register('email')} placeholder="user@company.com" />
              <FieldError error={errors.email?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('invite.role')}</label>
              <select
                {...register('role')}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="member">{t('roles.member')}</option>
                <option value="admin">{t('roles.admin')}</option>
              </select>
            </div>
            <Button type="submit">{t('invite.create')}</Button>
          </form>
          {message && <p className="mt-3 text-sm text-success">{message}</p>}
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {(data ?? []).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{inv.email}</p>
                  <p className="text-sm text-muted-foreground">{t(`roles.${inv.role}`)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={VARIANT[inv.status]}>{inv.status}</Badge>
                  {inv.status === 'sent' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const actor = (await services.auth.getSession())?.user.id ?? 'u1';
                        await services.admin.revokeInvitation(inv.id, actor);
                        refetch();
                      }}
                    >
                      {t('invite.revoke')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
