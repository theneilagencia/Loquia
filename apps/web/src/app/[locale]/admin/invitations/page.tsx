'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Badge, Button, Input, Skeleton } from '@loquia/ui';
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
    <div>
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Loquia · Admin</div>
      <h1 className="mb-6 text-[clamp(23px,2.5vw,30px)] font-bold tracking-[-0.03em] text-ink">{t('invitations')}</h1>

      <div className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-card">
          <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1 space-y-1.5">
              <label className="text-sm font-medium text-ink">{t('invite.email')}</label>
              <Input type="email" {...register('email')} placeholder="user@company.com" />
              <FieldError error={errors.email?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">{t('invite.role')}</label>
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
      </div>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-card">
            {(data ?? []).map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-3.5 transition-colors hover:bg-canvas">
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-semibold tracking-[-0.008em] text-ink">{inv.email}</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">{t(`roles.${inv.role}`)}</p>
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
        </div>
      )}
    </div>
  );
}
