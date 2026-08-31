'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { use, useEffect, useState } from 'react';
import { activateAccountSchema, type ActivateAccountInput } from '@loquia/contracts';
import type { Invitation } from '@loquia/domain';
import { buttonVariants, Button, Input, Label } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link, useRouter } from '@/i18n/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { FieldError } from '@/components/ui/field-error';

const inputClass =
  'h-auto rounded-[10px] border-border bg-canvas px-3 py-[11px] text-[14.5px] text-ink placeholder:text-faint focus-visible:border-iris focus-visible:bg-surface focus-visible:ring-0 focus-visible:ring-offset-0';
const labelClass = 'text-[13px] font-semibold text-ink';

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
      <div
        className="mx-auto flex w-full max-w-[520px] flex-col px-5 pb-[110px] pt-[clamp(36px,6vw,72px)]"
        style={{ animation: 'loq-rise .5s cubic-bezier(.2,.7,.3,1) both' }}
      >
        <h1 className="text-[clamp(24px,3vw,32px)] font-extrabold leading-tight tracking-[-0.03em] text-ink">
          {t('activateTitle')}
        </h1>
        <p className="mt-2.5 text-[15.5px] leading-relaxed text-muted-foreground">{t('activateSubtitle')}</p>

        {invalid ? (
          <div className="mt-6 rounded-xl border border-amber bg-amber-soft p-[26px]">
            <p role="alert" className="text-[14.5px] font-semibold leading-relaxed text-amber-ink">
              {t('activateInvalid')}
            </p>
            <Link href="/login" className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-4`}>
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-6 grid gap-4 rounded-xl border border-border bg-surface p-[26px] shadow-card"
            noValidate
          >
            {invitation && (
              <div>
                <div className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted-foreground">
                  {t('email')}
                </div>
                <div className="mt-1 text-[14.5px] font-semibold text-ink">{invitation.email}</div>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="name" className={labelClass}>
                {t('activateTitle')}
              </Label>
              <Input id="name" className={inputClass} {...register('name')} />
              <FieldError error={errors.name?.message} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password" className={labelClass}>
                {t('password')}
              </Label>
              <Input id="password" type="password" className={inputClass} {...register('password')} />
              <FieldError error={errors.password?.message} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword" className={labelClass}>
                {t('confirmPassword')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                className={inputClass}
                {...register('confirmPassword')}
              />
              <FieldError error={errors.confirmPassword?.message} />
            </div>
            {formError && (
              <div
                role="alert"
                className="rounded-[10px] border border-danger bg-danger-soft px-3.5 py-3 text-[13.5px] font-semibold text-danger"
              >
                {formError}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || invitation === undefined}
            >
              {t('activateSubmit')}
            </Button>
          </form>
        )}
      </div>
    </MarketingShell>
  );
}
