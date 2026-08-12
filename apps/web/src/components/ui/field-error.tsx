'use client';

import { useTranslations } from 'next-intl';

/**
 * Renders a validation error. Zod messages are i18n keys under `validation.*`;
 * anything else is shown verbatim.
 */
export function FieldError({ error }: { error?: string }) {
  const t = useTranslations('validation');
  if (!error) return null;
  const message = error.startsWith('validation.') ? t(error.replace('validation.', '')) : error;
  return (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}
