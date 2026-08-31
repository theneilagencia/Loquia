'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@loquia/contracts';
import { Button, Input, Label } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link } from '@/i18n/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { FieldError } from '@/components/ui/field-error';

const inputClass =
  'h-auto rounded-[10px] border-border bg-canvas px-3 py-[11px] text-[14.5px] text-ink placeholder:text-faint focus-visible:border-iris focus-visible:bg-surface focus-visible:ring-0 focus-visible:ring-offset-0';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const services = useServices();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    await services.auth.forgotPassword(values);
    setSent(true);
  });

  return (
    <MarketingShell>
      <div
        className="mx-auto flex w-full max-w-[420px] flex-col px-5 py-[clamp(40px,7vw,84px)]"
        style={{ animation: 'loq-rise .5s cubic-bezier(.2,.7,.3,1) both' }}
      >
        <h1 className="text-[clamp(24px,3vw,32px)] font-extrabold leading-tight tracking-[-0.03em] text-ink">
          {t('forgotTitle')}
        </h1>
        <p className="mt-2.5 text-[15.5px] leading-relaxed text-muted-foreground">{t('forgotSubtitle')}</p>

        {sent ? (
          <div className="mt-8 rounded-xl border border-sage bg-sage-soft p-[26px]">
            <p role="status" className="text-[14.5px] leading-relaxed text-ink">
              {t('forgotSent')}
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-8 grid gap-4 rounded-xl border border-border bg-surface p-[26px] shadow-card"
            noValidate
          >
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-[13px] font-semibold text-ink">
                {t('email')}
              </Label>
              <Input id="email" type="email" className={inputClass} {...register('email')} />
              <FieldError error={errors.email?.message} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {t('forgotSubmit')}
            </Button>
          </form>
        )}

        <div className="mt-5 text-sm">
          <Link href="/login" className="font-semibold text-iris hover:underline">
            ← {t('backToLogin')}
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}
