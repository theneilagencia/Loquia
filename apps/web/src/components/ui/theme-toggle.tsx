'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Theme } from '@loquia/domain';
import { cn } from '@loquia/ui';
import { useTheme } from '@/lib/theme';

const options: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: 'system', icon: Monitor, labelKey: 'themeSystem' },
  { value: 'light', icon: Sun, labelKey: 'themeLight' },
  { value: 'dark', icon: Moon, labelKey: 'themeDark' },
];

/**
 * Segmented theme switch (system / light / dark). `onDark` styles it for the
 * dark app rail; `fluid` makes it fill its container (equal-width segments).
 */
export function ThemeToggle({ onDark = false, fluid = false }: { onDark?: boolean; fluid?: boolean }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('common');
  return (
    <div
      role="radiogroup"
      aria-label={t('theme')}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg p-0.5',
        fluid && 'flex w-full',
        onDark ? 'bg-white/5 ring-1 ring-inset ring-white/10' : 'border border-border bg-card',
      )}
    >
      {options.map(({ value, icon: Icon, labelKey }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(labelKey)}
            onClick={() => setTheme(value)}
            className={cn(
              'grid place-items-center rounded-md transition-colors',
              fluid ? 'h-8 flex-1' : 'size-8',
              onDark
                ? active
                  ? 'bg-white/15 text-white'
                  : 'text-white/45 hover:text-white'
                : active
                  ? 'bg-secondary text-secondary-foreground ring-1 ring-ring'
                  : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
