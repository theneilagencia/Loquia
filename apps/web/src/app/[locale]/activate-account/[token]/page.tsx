'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { use, useEffect, useState } from 'react';
import { activateAccountSchema, type ActivateAccountInput } from '@loquia/contracts';
import type { Invitation } from '@loquia/domain';
import { Button, Card, CardContent, Input, Label } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { useRouter } from '@/i18n/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { FieldError } from '@/components/ui/field-error';

export default function ActivateAccountPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const t = useTranslations('auth');
  const services = useServices();
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ActivateAccountInput>({
    resolver: zodResolver(activateAccountSchema),
    defaultValues: { token },
  });

  useEffect(() => {
    services.auth.getInvitationByToken(token).then(setInvitation);
  }, [services, token]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await services.auth.activateAccount(values);
    if (result.ok) router.push('/onboarding');
    else setFormError(t('activateInvalid'));
  });

  const invalid = invitation === null || (invitation && invitation.status !== 'sent');

  return (
    <MarketingShell>
      <div className="container flex max-w-md flex-col py-20">
        <h1 className="text-3xl font-bold tracking-tight">{t('activateTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('activateSubtitle')}</p>
        <Card className="mt-8">
          <CardContent className="pt-6">
            {invalid ? (
              <p role="alert" className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {t('activateInvalid')}
              </p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                {invitation && (
                  <p className="text-sm text-muted-foreground">{invitation.email}</p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t('activateTitle')}</Label>
                  <Input id="name" {...register('name')} />
                  <FieldError error={errors.name?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input id="password" type="password" {...register('password')} />
                  <FieldError error={errors.password?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                  <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                  <FieldError error={errors.confirmPassword?.message} />
                </div>
                {formError && (
                  <p role="alert" className="text-sm text-destructive">
                    {formError}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting || invitation === undefined}>
                  {t('activateSubmit')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
}
