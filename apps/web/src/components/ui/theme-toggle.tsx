'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Theme } from '@loquia/domain';
import { Button, cn } from '@loquia/ui';
import { useTheme } from '@/lib/theme';

const options: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: 'system', icon: Monitor, labelKey: 'themeSystem' },
  { value: 'light', icon: Sun, labelKey: 'themeLight' },
  { value: 'dark', icon: Moon, labelKey: 'themeDark' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('common');
  return (
    <div
      role="radiogroup"
      aria-label={t('theme')}
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5"
    >
      {options.map(({ value, icon: Icon, labelKey }) => (
        <Button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={t(labelKey)}
          variant={theme === value ? 'secondary' : 'ghost'}
          size="icon"
          className={cn('h-8 w-8', theme === value && 'ring-1 ring-ring')}
          onClick={() => setTheme(value)}
        >
          <Icon />
        </Button>
      ))}
    </div>
  );
}
