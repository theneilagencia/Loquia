'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@loquia/domain';
import { Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link } from '@/i18n/navigation';
import { MeetingCard } from '@/components/product/meeting-card';

export default function AppHomePage() {
  const t = useTranslations('app');
  const nav = useTranslations('nav');
  const common = useTranslations('common');
  const services = useServices();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    services.auth.getSession().then(setSession).catch(() => {});
  }, [services]);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings', session?.workspace.id],
    queryFn: () => services.meetings.list(session!.workspace.id),
    enabled: !!session,
  });

  const recent = (meetings ?? []).slice(0, 4);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end gap-5">
        <div className="min-w-[260px] flex-1">
          {session && (
            <div className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-faint">
              {session.workspace.name}
            </div>
          )}
          <h1 className="text-[clamp(24px,2.6vw,32px)] font-extrabold leading-[1.14] tracking-[-0.03em] text-ink">
            {t('homeTitle')}
          </h1>
          {session && (
            <p className="mt-2.5 max-w-[56ch] text-[14.5px] leading-relaxed text-muted-foreground">
              {t('homeGreeting', { name: session.user.name })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/upload"
            className="rounded-lg border border-border bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:border-border-strong hover:bg-canvas"
          >
            {t('quickUpload')}
          </Link>
          <Link
            href="/app/record"
            className="flex items-center gap-2 rounded-lg bg-iris px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-iris/90"
          >
            <span className="size-[7px] rounded-full bg-white" />
            {t('quickRecord')}
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-3 bg-canvas px-[18px] py-3">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-faint">
            {t('recentMeetings')}
          </span>
          <span className="flex-1" />
          <Link
            href="/app/meetings"
            className="text-[12.5px] font-semibold text-iris hover:text-iris-strong"
          >
            {nav('meetings')}
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-[18px]">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : recent.length === 0 ? (
          <p className="px-[18px] py-10 text-center text-sm text-muted-foreground">
            {common('empty')}
          </p>
        ) : (
          recent.map((m) => <MeetingCard key={m.id} meeting={m} />)
        )}
      </section>
    </div>
  );
}
