'use client';

import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { activeLocales } from '@loquia/i18n';
import { cn } from '@loquia/ui';
import { usePathname, useRouter } from '@/i18n/navigation';

const LABELS: Record<string, string> = {
  'pt-BR': 'PT-BR',
  'en-US': 'EN-US',
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1 py-0.5">
      <Globe className="ml-1 size-4 text-muted-foreground" aria-hidden />
      {activeLocales.map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          aria-current={locale === l ? 'true' : undefined}
          className={cn(
            'rounded px-2 py-1 text-xs font-medium transition-colors',
            locale === l
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() =>
            startTransition(() => {
              router.replace(pathname, { locale: l });
            })
          }
        >
          {LABELS[l] ?? l}
        </button>
      ))}
    </div>
  );
}
