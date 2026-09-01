'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import type { Meeting } from '@loquia/domain';
import { cn } from '@loquia/ui';
import { Link } from '@/i18n/navigation';
import { useServices } from '@/lib/services-context';
import { getLocalMediaStore } from '@/lib/local-media/provider';
import { formatDate, minutesOf } from '@/lib/format';
import { MeetingStatusBadge, STATUS_DOT } from './meeting-status-badge';

/**
 * A single meeting row. The main area links to the meeting detail; a trailing
 * delete button removes the recording (server copy + the on-device copy), the
 * same flow as the detail page's Delete action.
 */
export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const t = useTranslations('meetings');
  const locale = useLocale();
  const services = useServices();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm(t('deleteConfirm'))) return;
    setDeleting(true);
    try {
      // Deleting the meeting also removes the on-device copy (best effort).
      try {
        const store = await getLocalMediaStore(meeting.workspaceId);
        const asset = store.getByMeeting(meeting.id);
        if (asset) await store.delete(asset.id);
      } catch {
        /* on-device cleanup is best effort */
      }
      const res = await services.meetings.remove(meeting.id);
      if (res.ok) await queryClient.invalidateQueries({ queryKey: ['meetings'] });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border px-[18px] py-3.5 transition-colors first:border-t-0 hover:bg-canvas">
      <Link
        href={`/app/meetings/${meeting.id}`}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1.5"
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
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label={t('delete')}
        title={t('delete')}
        className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
