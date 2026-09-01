'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@loquia/domain';
import { Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link } from '@/i18n/navigation';
import { MeetingCard } from '@/components/product/meeting-card';

export default function MeetingsPage() {
  const t = useTranslations('meetings');
  const nav = useTranslations('nav');
  const services = useServices();
  const [session, setSession] = useState<Session | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    services.auth.getSession().then(setSession).catch(() => {});
  }, [services]);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings', session?.workspace.id, showArchived],
    queryFn: () => services.meetings.list(session!.workspace.id, showArchived),
    enabled: !!session,
  });

  const list = meetings ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[240px] flex-1">
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-faint">
            {list.length} {nav('meetings')}
          </div>
          <h1 className="text-[clamp(24px,2.6vw,32px)] font-extrabold tracking-[-0.03em] text-ink">
            {t('title')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="accent-iris"
            />
            {t('showArchived')}
          </label>
          <Link
            href="/app/record"
            className="rounded-lg bg-iris px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-iris/90"
          >
            {t('new')}
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-[18px] shadow-card">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-8 py-14 text-center shadow-card">
          <p className="text-[15.5px] font-semibold text-ink">{t('empty')}</p>
          <Link
            href="/app/record"
            className="mt-5 inline-flex rounded-lg bg-iris px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-iris/90"
          >
            {t('new')}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          {list.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      )}
    </div>
  );
}
