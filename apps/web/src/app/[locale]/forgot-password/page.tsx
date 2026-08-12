'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@loquia/contracts';
import { Button, Card, CardContent, Input, Label } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { FieldError } from '@/components/ui/field-error';

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
      <div className="container flex max-w-md flex-col py-20">
        <h1 className="text-3xl font-bold tracking-tight">{t('forgotTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('forgotSubtitle')}</p>
        <Card className="mt-8">
          <CardContent className="pt-6">
            {sent ? (
              <p role="status" className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                {t('forgotSent')}
              </p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input id="email" type="email" {...register('email')} />
                  <FieldError error={errors.email?.message} />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {t('forgotSubmit')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
}
