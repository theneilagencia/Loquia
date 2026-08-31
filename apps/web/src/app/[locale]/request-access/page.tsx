'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { requestAccessSchema, type RequestAccessInput } from '@loquia/contracts';
import { Button, Input, Label, Textarea } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { useRouter } from '@/i18n/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { FieldError } from '@/components/ui/field-error';

const inputClass =
  'h-auto rounded-[10px] border-border bg-canvas px-3 py-[11px] text-[14.5px] text-ink placeholder:text-faint focus-visible:border-iris focus-visible:bg-surface focus-visible:ring-0 focus-visible:ring-offset-0';
const labelClass = 'text-[13px] font-semibold text-ink';

export default function RequestAccessPage() {
  const t = useTranslations('access');
  const services = useServices();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestAccessInput>({
    resolver: zodResolver(requestAccessSchema),
    defaultValues: { preferredLocale: 'pt-BR' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    const result = await services.access.requestAccess(values);
    setSubmitting(false);
    if (result.ok) router.push('/request-access/success');
  });

  return (
    <MarketingShell>
      <div
        className="mx-auto w-full max-w-[780px] px-5 pb-[110px] pt-[clamp(48px,7vw,72px)]"
        style={{ animation: 'loq-rise .5s cubic-bezier(.2,.7,.3,1) both' }}
      >
        <h1 className="text-[clamp(28px,3.4vw,42px)] font-extrabold leading-[1.1] tracking-[-0.032em] text-ink">
          {t('requestTitle')}
        </h1>
        <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-muted-foreground">
          {t('requestSubtitle')}
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-10 rounded-xl border border-border bg-surface p-[clamp(22px,3vw,32px)] shadow-card"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="name" className={labelClass}>
                {t('name')}
              </Label>
              <Input id="name" className={inputClass} {...register('name')} aria-invalid={!!errors.name} />
              <FieldError error={errors.name?.message} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="email" className={labelClass}>
                {t('email')}
              </Label>
              <Input
                id="email"
                type="email"
                className={inputClass}
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              <FieldError error={errors.email?.message} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="company" className={labelClass}>
                {t('company')}
              </Label>
              <Input
                id="company"
                className={inputClass}
                {...register('company')}
                aria-invalid={!!errors.company}
              />
              <FieldError error={errors.company?.message} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="role" className={labelClass}>
                {t('role')}
              </Label>
              <Input id="role" className={inputClass} {...register('role')} aria-invalid={!!errors.role} />
              <FieldError error={errors.role?.message} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="useCase" className={labelClass}>
                {t('useCase')}
              </Label>
              <Textarea
                id="useCase"
                rows={4}
                className={`${inputClass} min-h-[104px] leading-relaxed`}
                {...register('useCase')}
                aria-invalid={!!errors.useCase}
              />
              <FieldError error={errors.useCase?.message} />
            </div>
          </div>
          <input type="hidden" {...register('preferredLocale')} />
          <Button type="submit" className="mt-7 w-full" disabled={submitting}>
            {t('submit')}
          </Button>
        </form>
      </div>
    </MarketingShell>
  );
}
