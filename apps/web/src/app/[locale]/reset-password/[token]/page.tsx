'use client';

import { use, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { resetPasswordSchema, type ResetPasswordInput } from '@loquia/contracts';
import { Button, Card, CardContent, Input, Label } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link } from '@/i18n/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { FieldError } from '@/components/ui/field-error';

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
      <div className="container flex max-w-md flex-col py-20">
        <h1 className="text-3xl font-bold tracking-tight">{t('resetTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('resetSubtitle')}</p>
        <Card className="mt-8">
          <CardContent className="pt-6">
            {done ? (
              <div className="space-y-4">
                <p role="status" className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                  {t('resetDone')}
                </p>
                <Link href="/login" className="text-sm text-primary hover:underline">
                  {t('backToLogin')}
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <input type="hidden" {...register('token')} />
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t('newPassword')}</Label>
                  <Input id="password" type="password" {...register('password')} />
                  <FieldError error={errors.password?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                  <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                  <FieldError error={errors.confirmPassword?.message} />
                </div>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {t('resetSubmit')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
}
