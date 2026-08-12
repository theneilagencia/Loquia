'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mic, Search, Upload, Video } from 'lucide-react';
import { Input } from '@loquia/ui';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from '@/i18n/navigation';

interface Command {
  labelKey: string;
  href: string;
  icon: typeof Mic;
}

const COMMANDS: Command[] = [
  { labelKey: 'quickRecord', href: '/app/record', icon: Mic },
  { labelKey: 'quickUpload', href: '/app/upload', icon: Upload },
  { labelKey: 'recentMeetings', href: '/app/meetings', icon: Video },
  { labelKey: 'homeTitle', href: '/app', icon: Search },
];

export function CommandPalette() {
  const t = useTranslations('app');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const items = COMMANDS.filter((c) => t(c.labelKey).toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0">
        <DialogTitle className="sr-only">{t('commandPalette')}</DialogTitle>
        <div className="border-b border-border p-3">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('commandHint')}
            className="border-0 focus-visible:ring-0"
          />
        </div>
        <ul className="max-h-72 overflow-auto p-2">
          {items.map((c) => (
            <li key={c.href}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary"
                onClick={() => {
                  setOpen(false);
                  router.push(c.href);
                }}
              >
                <c.icon className="size-4 text-muted-foreground" /> {t(c.labelKey)}
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">—</li>
          )}
        </ul>
      </DialogContent>
      <button type="button" onClick={() => setOpen(true)} className="hidden" aria-hidden />
    </Dialog>
  );
}

export function useCommandPalette() {
  const [, force] = useState(0);
  return { open: () => force((n) => n + 1) };
}
