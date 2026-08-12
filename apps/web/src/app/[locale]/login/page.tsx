'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { loginSchema, type LoginInput } from '@loquia/contracts';
import { Button, Card, CardContent, Input, Label } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link, useRouter } from '@/i18n/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { FieldError } from '@/components/ui/field-error';

export default function LoginPage() {
  const t = useTranslations('auth');
  const services = useServices();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      <div className="container flex max-w-md flex-col py-20">
        <h1 className="text-3xl font-bold tracking-tight">{t('loginTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('loginSubtitle')}</p>
        <Card className="mt-8">
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" placeholder="vinicius@apymine.com" {...register('email')} />
                <FieldError error={errors.email?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t('password')}</Label>
                <Input id="password" type="password" {...register('password')} />
                <FieldError error={errors.password?.message} />
              </div>
              {formError && (
                <p role="alert" className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  {formError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {t('submit')}
              </Button>
              <div className="text-center text-sm">
                <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
                  {t('forgot')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
}
