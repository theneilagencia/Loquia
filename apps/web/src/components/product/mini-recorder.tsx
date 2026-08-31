'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Pause, Play, Square } from 'lucide-react';
import { useRecorder } from '@/lib/use-recorder';
import { Link } from '@/i18n/navigation';
import { formatDuration } from '@/lib/format';
import { Waveform } from './waveform';

/**
 * Persistent mini-recorder (task spec §24). Renders whenever a recording is
 * active and the user is NOT on the /record page, so recording state never
 * depends on that page being mounted. Lives inside the dark app rail (design).
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
    <div className="animate-loq-in rounded-xl border border-white/15 p-3.5">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger/70" />
          <span className="relative inline-flex size-2 rounded-full bg-danger" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-inverse-fg/60">
          {recording ? t('recording') : t('paused')}
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[13px] tabular-nums text-inverse-fg">
          {formatDuration(elapsedSeconds)}
        </span>
      </div>

      <Waveform peaks={liveWaveform.slice(-24)} live={recording} className="mt-2.5 h-5 w-full" />

      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={recording ? pause : resume}
          aria-label={recording ? t('pause') : t('resume')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/20 py-1.5 text-xs font-semibold text-inverse-fg transition-colors hover:bg-white/10"
        >
          {recording ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {recording ? t('pause') : t('resume')}
        </button>
        <button
          type="button"
          onClick={() => void finish()}
          aria-label={t('finish')}
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-danger text-white transition-colors hover:bg-danger/90"
        >
          <Square className="size-3.5" />
        </button>
        <Link
          href="/app/record"
          className="flex flex-1 items-center justify-center rounded-lg bg-canvas py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-track"
        >
          {t('title')}
        </Link>
      </div>
    </div>
  );
}
