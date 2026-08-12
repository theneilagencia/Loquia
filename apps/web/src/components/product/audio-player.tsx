'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@loquia/ui';
import { formatDuration } from '@/lib/format';
import { Waveform } from './waveform';

/**
 * Mock audio player. There is no real audio in Milestone 1, so playback is
 * simulated against the meeting duration — enough to drive the waveform,
 * timestamp and TimestampLink seeking behaviour.
 */
export function AudioPlayer({
  durationSeconds,
  peaks,
  seekTo,
  onSeeked,
}: {
  durationSeconds: number;
  peaks: number[];
  seekTo?: number | null;
  onSeeked?: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (seekTo != null) {
      setPosition(Math.min(durationSeconds, Math.max(0, seekTo)));
      onSeeked?.();
    }
  }, [seekTo, durationSeconds, onSeeked]);

  useEffect(() => {
    if (!playing) return;
    raf.current = setInterval(() => {
      setPosition((p) => {
        if (p >= durationSeconds) {
          setPlaying(false);
          return durationSeconds;
        }
        return p + 1;
      });
    }, 1000);
    return () => {
      if (raf.current) clearInterval(raf.current);
    };
  }, [playing, durationSeconds]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Button
        size="icon"
        variant="secondary"
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={() => setPlaying((p) => !p)}
      >
        {playing ? <Pause /> : <Play />}
      </Button>
      <Waveform peaks={peaks} progress={durationSeconds ? position / durationSeconds : 0} className="flex-1" />
      <span className="w-24 text-right font-mono text-xs text-muted-foreground">
        {formatDuration(position)} / {formatDuration(durationSeconds)}
      </span>
    </div>
  );
}
