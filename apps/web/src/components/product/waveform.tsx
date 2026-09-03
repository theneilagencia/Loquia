'use client';

import { cn } from '@loquia/ui';

/** Renders normalized peaks [0,1] as vertical bars. */
export function Waveform({
  peaks,
  className,
  live = false,
  progress,
}: {
  peaks: number[];
  className?: string;
  live?: boolean;
  /** 0–1 playback progress; bars before it are highlighted. */
  progress?: number;
}) {
  const data = peaks.length ? peaks : [0.2, 0.4, 0.3, 0.5];
  return (
    <div
      className={cn('flex h-12 items-center gap-0.5 overflow-hidden', className)}
      role="img"
      aria-label="waveform"
    >
      {data.map((peak, i) => {
        const active = progress != null && i / data.length <= progress;
        return (
          <span
            key={i}
            // Bars flex to SHARE the available width and never overflow the
            // container, regardless of how many samples accumulate (a fixed-width
            // bar list overflowed and broke the recording card's layout).
            className={cn(
              'min-w-0 max-w-[4px] flex-1 rounded-full',
              active ? 'bg-primary' : 'bg-muted-foreground/40',
              live && i === data.length - 1 && 'animate-pulsebar bg-primary',
            )}
            style={{ height: `${Math.max(8, peak * 100)}%` }}
          />
        );
      })}
    </div>
  );
}
