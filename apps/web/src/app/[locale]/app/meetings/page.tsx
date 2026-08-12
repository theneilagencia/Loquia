'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Video } from 'lucide-react';
import type { Session } from '@loquia/domain';
import { buttonVariants, Card, CardContent, Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link } from '@/i18n/navigation';
import { MeetingCard } from '@/components/product/meeting-card';

export default function MeetingsPage() {
  const t = useTranslations('meetings');
  const services = useServices();
  const [session, setSession] = useState<Session | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    services.auth.getSession().then(setSession);
  }, [services]);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings', session?.workspace.id, showArchived],
    queryFn: () => services.meetings.list(session!.workspace.id, showArchived),
    enabled: !!session,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            {t('showArchived')}
          </label>
          <Link href="/app/record" className={buttonVariants({ size: 'sm' })}>
            {t('new')}
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (meetings ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Video className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">{t('empty')}</p>
            <Link href="/app/record" className={buttonVariants()}>
              {t('new')}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(meetings ?? []).map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      )}
    </div>
  );
}
