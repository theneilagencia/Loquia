'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Pause, Play, Square } from 'lucide-react';
import { Button } from '@loquia/ui';
import { useRecorder } from '@/lib/use-recorder';
import { Link } from '@/i18n/navigation';
import { formatDuration } from '@/lib/format';
import { Waveform } from './waveform';

/**
 * Persistent mini-recorder (task spec §24). Renders whenever a recording is
 * active and the user is NOT on the /record page, so recording state never
 * depends on that page being mounted.
 */
export function MiniRecorder() {
  const t = useTranslations('recorder');
  const { runState, elapsedSeconds, liveWaveform, pause, resume, finish } = useRecorder();
  const pathname = usePathname();

  const active = runState === 'recording' || runState === 'paused';
  const onRecordPage = pathname.endsWith('/record');
  if (!active || onRecordPage) return null;

  const recording = runState === 'recording';

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(28rem,92vw)] -translate-x-1/2 animate-fade-in">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card/95 px-4 py-2 shadow-lg backdrop-blur">
        <span className="relative flex size-2.5 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/70" />
          <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
        </span>
        <span className="font-mono text-sm tabular-nums">{formatDuration(elapsedSeconds)}</span>
        <Waveform peaks={liveWaveform.slice(-24)} live={recording} className="h-6 flex-1" />
        <div className="flex items-center gap-1">
          {recording ? (
            <Button size="icon" variant="ghost" className="size-8" aria-label={t('pause')} onClick={pause}>
              <Pause className="size-4" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="size-8" aria-label={t('resume')} onClick={resume}>
              <Play className="size-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="size-8 text-destructive" aria-label={t('finish')} onClick={() => void finish()}>
            <Square className="size-4" />
          </Button>
          <Link href="/app/record" className="ml-1 text-xs text-muted-foreground hover:text-foreground">
            {t('title')}
          </Link>
        </div>
      </div>
    </div>
  );
}
