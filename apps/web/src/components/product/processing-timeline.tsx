'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { PROCESSING_STAGES, type ProcessingJob } from '@loquia/domain';
import { cn } from '@loquia/ui';

export function ProcessingTimeline({ job }: { job: ProcessingJob }) {
  const t = useTranslations('processing.stages');
  const currentIndex = PROCESSING_STAGES.indexOf(job.stage);

  return (
    <ol className="space-y-1">
      {PROCESSING_STAGES.map((stage, index) => {
        const done = job.status === 'completed' || index < currentIndex;
        const active = index === currentIndex && job.status !== 'completed';
        const failed = active && job.status === 'failed';
        return (
          <li key={stage} className="flex items-center gap-3 py-1.5">
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full border text-xs',
                done && 'border-success bg-success text-success-foreground',
                active && !failed && 'border-primary text-primary',
                failed && 'border-destructive bg-destructive text-destructive-foreground',
                !done && !active && 'border-border text-muted-foreground',
              )}
            >
              {done ? (
                <Check className="size-4" />
              ) : failed ? (
                <AlertCircle className="size-4" />
              ) : active ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                'text-sm',
                done && 'text-foreground',
                active && 'font-medium text-foreground',
                !done && !active && 'text-muted-foreground',
              )}
            >
              {t(stage)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
