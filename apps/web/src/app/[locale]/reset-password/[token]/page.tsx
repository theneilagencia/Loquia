'use client';

import { use, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { resetPasswordSchema, type ResetPasswordInput } from '@loquia/contracts';
import { Button, Input, Label } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link } from '@/i18n/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { FieldError } from '@/components/ui/field-error';

const inputClass =
  'h-auto rounded-[10px] border-border bg-canvas px-3 py-[11px] text-[14.5px] text-ink placeholder:text-faint focus-visible:border-iris focus-visible:bg-surface focus-visible:ring-0 focus-visible:ring-offset-0';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const t = useTranslations('auth');
  const services = useServices();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await services.auth.resetPassword({ ...values, token });
    if (res.ok) setDone(true);
    else setError(t('resetInvalid'));
  });

  return (
    <MarketingShell>
      <div
        className="mx-auto flex w-full max-w-[420px] flex-col px-5 py-[clamp(40px,7vw,84px)]"
        style={{ animation: 'loq-rise .5s cubic-bezier(.2,.7,.3,1) both' }}
      >
        <h1 className="text-[clamp(24px,3vw,32px)] font-extrabold leading-tight tracking-[-0.03em] text-ink">
          {t('resetTitle')}
        </h1>
        <p className="mt-2.5 text-[15.5px] leading-relaxed text-muted-foreground">{t('resetSubtitle')}</p>

        {done ? (
          <div className="mt-8 rounded-xl border border-sage bg-sage-soft p-[26px]">
            <p role="status" className="text-[14.5px] leading-relaxed text-ink">
              {t('resetDone')}
            </p>
            <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-iris hover:underline">
              ← {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-8 grid gap-4 rounded-xl border border-border bg-surface p-[26px] shadow-card"
            noValidate
          >
            <input type="hidden" {...register('token')} />
            <div className="grid gap-1.5">
              <Label htmlFor="password" className="text-[13px] font-semibold text-ink">
                {t('newPassword')}
              </Label>
              <Input id="password" type="password" className={inputClass} {...register('password')} />
              <FieldError error={errors.password?.message} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword" className="text-[13px] font-semibold text-ink">
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
            {error && (
              <div
                role="alert"
                className="rounded-[10px] border border-danger bg-danger-soft px-3.5 py-3 text-[13.5px] font-semibold text-danger"
              >
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {t('resetSubmit')}
            </Button>
          </form>
        )}
      </div>
    </MarketingShell>
  );
}
