'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginInput } from '@loquia/contracts';
import { Button, Input, Label } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link, useRouter } from '@/i18n/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { FieldError } from '@/components/ui/field-error';

const inputClass =
  'h-auto rounded-[10px] border-border bg-canvas px-3 py-[11px] text-[14.5px] text-ink placeholder:text-faint focus-visible:border-iris focus-visible:bg-surface focus-visible:ring-0 focus-visible:ring-offset-0';

export default function LoginPage() {
  const t = useTranslations('auth');
  const nav = useTranslations('nav');
  const services = useServices();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setFormError(null);
    const result = await services.auth.login(values);
    setSubmitting(false);
    if (result.ok) router.push('/app');
    else setFormError(t('genericError'));
  });

  return (
    <MarketingShell>
      <div
        className="mx-auto flex w-full max-w-[420px] flex-col px-5 py-[clamp(40px,7vw,84px)]"
        style={{ animation: 'loq-rise .5s cubic-bezier(.2,.7,.3,1) both' }}
      >
        <h1 className="text-[clamp(26px,3.2vw,34px)] font-extrabold leading-tight tracking-[-0.03em] text-ink">
          {t('loginTitle')}
        </h1>
        <p className="mt-2.5 text-[15.5px] leading-relaxed text-muted-foreground">{t('loginSubtitle')}</p>

        <form
          onSubmit={onSubmit}
          className="mt-8 grid gap-4 rounded-xl border border-border bg-surface p-[26px] shadow-card"
          noValidate
        >
          <div className="grid gap-1.5">
            <Label htmlFor="email" className="text-[13px] font-semibold text-ink">
              {t('email')}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="vinicius@apymine.com"
              className={inputClass}
              {...register('email')}
            />
            <FieldError error={errors.email?.message} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password" className="text-[13px] font-semibold text-ink">
              {t('password')}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${inputClass} pr-11`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[10px] text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:text-iris"
              >
                {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            </div>
            <FieldError error={errors.password?.message} />
          </div>
          {formError && (
            <p
              role="alert"
              className="rounded-[10px] border border-border bg-track px-3.5 py-3 text-[13.5px] leading-relaxed text-muted-foreground"
            >
              {formError}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {t('submit')}
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap gap-x-[18px] gap-y-2 text-sm">
          <Link href="/forgot-password" className="font-semibold text-iris hover:underline">
            {t('forgot')}
          </Link>
          <Link href="/request-access" className="font-semibold text-iris hover:underline">
            {nav('requestAccess')}
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}
