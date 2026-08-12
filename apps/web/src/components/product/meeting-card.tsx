'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Clock, Mic, Upload, Users } from 'lucide-react';
import type { Meeting } from '@loquia/domain';
import { Card, CardContent } from '@loquia/ui';
import { Link } from '@/i18n/navigation';
import { formatDate, minutesOf } from '@/lib/format';
import { MeetingStatusBadge } from './meeting-status-badge';

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const t = useTranslations('meetings');
  const locale = useLocale();
  const SourceIcon = meeting.source === 'recording' ? Mic : Upload;
  return (
    <Link href={`/app/meetings/${meeting.id}`} className="block">
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold leading-snug">{meeting.title}</h3>
            <MeetingStatusBadge status={meeting.status} />
          </div>
          {meeting.summaryLine && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{meeting.summaryLine}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <SourceIcon className="size-3.5" /> {meeting.source}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {t('durationLabel', { minutes: minutesOf(meeting.durationSeconds) })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" /> {meeting.participantCount}
            </span>
            <span>{formatDate(meeting.createdAt, locale)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
