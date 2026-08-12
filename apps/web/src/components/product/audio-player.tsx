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
  src,
}: {
  durationSeconds: number;
  peaks: number[];
  seekTo?: number | null;
  onSeeked?: () => void;
  /** Real audio URL (presigned). When present, playback drives a real element. */
  src?: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (seekTo != null) {
      const clamped = Math.min(durationSeconds, Math.max(0, seekTo));
      setPosition(clamped);
      if (src && audioRef.current) audioRef.current.currentTime = clamped;
      onSeeked?.();
    }
  }, [seekTo, durationSeconds, onSeeked, src]);

  useEffect(() => {
    if (src) return; // a real element drives position via timeupdate
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
  }, [playing, durationSeconds, src]);

  function toggle() {
    if (src && audioRef.current) {
      if (playing) audioRef.current.pause();
      else void audioRef.current.play();
    }
    setPlaying((p) => !p);
  }

  const effectiveDuration = durationSeconds || 1;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onTimeUpdate={(e) => setPosition(Math.floor(e.currentTarget.currentTime))}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      )}
      <Button size="icon" variant="secondary" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle}>
        {playing ? <Pause /> : <Play />}
      </Button>
      <Waveform peaks={peaks} progress={position / effectiveDuration} className="flex-1" />
      <span className="w-24 text-right font-mono text-xs text-muted-foreground">
        {formatDuration(position)} / {formatDuration(durationSeconds)}
      </span>
    </div>
  );
}
