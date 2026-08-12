'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { requestAccessSchema, type RequestAccessInput } from '@loquia/contracts';
import { Button, Card, CardContent, Input, Label, Textarea } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { useRouter } from '@/i18n/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { FieldError } from '@/components/ui/field-error';

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
      <div className="container max-w-xl py-16">
        <h1 className="text-3xl font-bold tracking-tight">{t('requestTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('requestSubtitle')}</p>
        <Card className="mt-8">
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="name">{t('name')}</Label>
                <Input id="name" {...register('name')} aria-invalid={!!errors.name} />
                <FieldError error={errors.name?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" {...register('email')} aria-invalid={!!errors.email} />
                <FieldError error={errors.email?.message} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="company">{t('company')}</Label>
                  <Input id="company" {...register('company')} aria-invalid={!!errors.company} />
                  <FieldError error={errors.company?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">{t('role')}</Label>
                  <Input id="role" {...register('role')} aria-invalid={!!errors.role} />
                  <FieldError error={errors.role?.message} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="useCase">{t('useCase')}</Label>
                <Textarea id="useCase" rows={4} {...register('useCase')} aria-invalid={!!errors.useCase} />
                <FieldError error={errors.useCase?.message} />
              </div>
              <input type="hidden" {...register('preferredLocale')} />
              <Button type="submit" className="w-full" disabled={submitting}>
                {t('submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
}
