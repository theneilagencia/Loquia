'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, cn } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { useRouter } from '@/i18n/navigation';
import { Logo } from '@/components/brand/logo';

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const common = useTranslations('common');
  const services = useServices();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const steps = [
    { title: t('step1Title'), body: t('step1Body') },
    { title: t('step2Title'), body: t('step2Body') },
    { title: t('step3Title'), body: t('step3Body') },
    { title: t('step4Title'), body: t('step4Body') },
  ];
  const isLast = step === steps.length - 1;

  async function next() {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    const session = await services.auth.getSession();
    if (session) await services.access.completeOnboarding(session.user.id);
    router.push('/app');
  }

  const current = steps[step]!;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5 py-[clamp(24px,5vw,64px)]">
      <div
        className="w-full max-w-[560px]"
        style={{ animation: 'loq-rise .5s cubic-bezier(.2,.7,.3,1) both' }}
      >
        <div className="mb-[26px] flex items-center gap-2.5">
          <Logo />
          <span className="flex-1" />
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'grid size-[26px] place-items-center rounded-full border font-mono text-[11px]',
                  i < step && 'border-sage bg-sage-soft text-sage',
                  i === step && 'border-iris bg-iris text-inverse-fg',
                  i > step && 'border-border bg-surface text-faint',
                )}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-[clamp(24px,3vw,34px)] shadow-card">
          <h1 className="text-[26px] font-extrabold tracking-[-0.028em] text-ink">{current.title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{current.body}</p>

          <div className="mt-[26px] flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-lg border border-border bg-transparent px-3.5 py-2 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            >
              {common('back')}
            </button>
            <span className="flex-1" />
            {isLast ? (
              <Button onClick={next}>
                {t('finish')} <ArrowRight className="size-4" />
              </Button>
            ) : (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-2 rounded-lg bg-inverse-surface px-4 py-2.5 text-[14.5px] font-semibold text-inverse-fg transition-colors hover:bg-ink-hover"
              >
                {t('next')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
