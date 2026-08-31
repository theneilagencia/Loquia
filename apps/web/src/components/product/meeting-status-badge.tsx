'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@loquia/ui';
import type { MeetingStatus } from '@loquia/domain';

/** Mono status pills (design handoff): sage / amber / danger on soft grounds. */
const STYLES: Record<MeetingStatus, string> = {
  draft: 'bg-track text-muted-foreground',
  processing: 'bg-amber-soft text-amber',
  ready: 'bg-sage-soft text-sage',
  failed: 'bg-danger-soft text-danger',
  archived: 'bg-track text-faint',
};

/** Left-rail status dots reuse the same palette. */
export const STATUS_DOT: Record<MeetingStatus, string> = {
  draft: 'bg-muted-foreground',
  processing: 'bg-amber',
  ready: 'bg-sage',
  failed: 'bg-danger',
  archived: 'bg-faint',
};

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const t = useTranslations('meetings.status');
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-[5px] px-1.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.09em]',
        STYLES[status],
      )}
    >
      {t(status)}
    </span>
  );
}
