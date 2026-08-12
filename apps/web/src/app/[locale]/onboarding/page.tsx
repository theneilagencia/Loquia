'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button, Card, CardContent, cn } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { useRouter } from '@/i18n/navigation';
import { Logo } from '@/components/brand/logo';

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const services = useServices();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const steps = [
    { title: t('step1Title'), body: t('step1Body') },
    { title: t('step2Title'), body: t('step2Body') },
    { title: t('step3Title'), body: t('step3Body') },
  ];

  async function next() {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    const session = await services.auth.getSession();
    if (session) await services.access.completeOnboarding(session.user.id);
    router.push('/app');
  }

  const current = steps[step]!;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6">
      <Logo className="mb-8" />
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-6 pt-8">
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-xs font-semibold',
                  i < step && 'bg-success text-success-foreground',
                  i === step && 'bg-primary text-primary-foreground',
                  i > step && 'bg-muted text-muted-foreground',
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{current.title}</h1>
            <p className="text-muted-foreground">{current.body}</p>
          </div>
          <Button onClick={next} className="w-full">
            {step < steps.length - 1 ? t('title') : t('finish')} <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
