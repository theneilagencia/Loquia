'use client';

import { cn } from '@loquia/ui';
import { formatDuration } from '@/lib/format';

export function TimestampLink({
  seconds,
  onSeek,
  className,
}: {
  seconds: number;
  onSeek?: (seconds: number) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSeek?.(seconds)}
      className={cn(
        'rounded font-mono text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {formatDuration(seconds)}
    </button>
  );
}
