'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Meeting } from '@loquia/domain';
import { cn } from '@loquia/ui';
import { Link } from '@/i18n/navigation';
import { formatDate, minutesOf } from '@/lib/format';
import { MeetingStatusBadge, STATUS_DOT } from './meeting-status-badge';

/**
 * A single meeting row. Rendered inside a bordered surface card (home + list);
 * rows self-divide with a top border (first row excepted).
 */
export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const t = useTranslations('meetings');
  const locale = useLocale();
  return (
    <Link
      href={`/app/meetings/${meeting.id}`}
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border px-[18px] py-3.5 transition-colors first:border-t-0 hover:bg-canvas"
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT[meeting.status])} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[14.5px] font-semibold tracking-[-0.008em] text-ink">
            {meeting.title}
          </span>
          <MeetingStatusBadge status={meeting.status} />
        </div>
        <div className="mt-1 truncate text-[12.5px] text-muted-foreground">
          {meeting.summaryLine ??
            `${meeting.source} · ${t('durationLabel', { minutes: minutesOf(meeting.durationSeconds) })} · ${t('participants', { count: meeting.participantCount })}`}
        </div>
      </div>
      <span className="shrink-0 font-mono text-[11.5px] uppercase text-faint">
        {meeting.meetingLanguage}
      </span>
      <span className="shrink-0 whitespace-nowrap text-[12.5px] text-muted-foreground">
        {formatDate(meeting.createdAt, locale)}
      </span>
    </Link>
  );
}
