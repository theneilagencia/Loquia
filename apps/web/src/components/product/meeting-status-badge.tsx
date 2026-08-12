'use client';

import { useTranslations } from 'next-intl';
import { Badge, type BadgeProps } from '@loquia/ui';
import type { MeetingStatus } from '@loquia/domain';

const VARIANT: Record<MeetingStatus, BadgeProps['variant']> = {
  draft: 'secondary',
  processing: 'warning',
  ready: 'success',
  failed: 'destructive',
  archived: 'outline',
};

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const t = useTranslations('meetings.status');
  return <Badge variant={VARIANT[status]}>{t(status)}</Badge>;
}
