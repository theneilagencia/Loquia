'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@loquia/ui';

/**
 * Error boundary implementing the task's error-message contract (§34):
 * every message answers what happened, what was preserved, and the next action.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('errors');
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">{t('genericTitle')}</h1>
      <div className="max-w-md space-y-2 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">{t('whatHappened')}: </span>
          {t('genericBody')}
        </p>
        <p>
          <span className="font-medium text-foreground">{t('whatPreserved')}: </span>
          {t('offlineBody')}
        </p>
      </div>
      <Button onClick={reset}>{t('nextAction')}</Button>
    </div>
  );
}
