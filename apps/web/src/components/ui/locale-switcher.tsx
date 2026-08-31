'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { activeLocales } from '@loquia/i18n';
import { cn } from '@loquia/ui';
import { usePathname, useRouter } from '@/i18n/navigation';

const LABELS: Record<string, string> = {
  'pt-BR': 'PT-BR',
  'en-US': 'EN-US',
};

/**
 * Segmented locale switch. `onDark` styles it for the dark app rail; `fluid`
 * makes it fill its container (equal-width segments).
 */
export function LocaleSwitcher({ onDark = false, fluid = false }: { onDark?: boolean; fluid?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="radiogroup"
      aria-label="Locale"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg p-0.5',
        fluid && 'flex w-full',
        onDark ? 'bg-white/5 ring-1 ring-inset ring-white/10' : 'border border-border bg-card',
      )}
    >
      {activeLocales.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={pending}
            className={cn(
              'whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
              fluid && 'flex-1',
              onDark
                ? active
                  ? 'bg-white/15 text-white'
                  : 'text-white/55 hover:text-white'
                : active
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
        );
      })}
    </div>
  );
}
