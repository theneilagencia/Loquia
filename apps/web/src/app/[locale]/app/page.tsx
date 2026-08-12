'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Mic, Upload } from 'lucide-react';
import type { Session } from '@loquia/domain';
import { buttonVariants, Card, CardContent, Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link } from '@/i18n/navigation';
import { MeetingCard } from '@/components/product/meeting-card';

export default function AppHomePage() {
  const t = useTranslations('app');
  const nav = useTranslations('nav');
  const services = useServices();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    services.auth.getSession().then(setSession);
  }, [services]);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings', session?.workspace.id],
    queryFn: () => services.meetings.list(session!.workspace.id),
    enabled: !!session,
  });

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t('homeTitle')}</h1>
        {session && <p className="text-muted-foreground">{t('homeGreeting', { name: session.user.name })}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/app/record">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <Mic className="size-5" />
              </div>
              <span className="font-medium">{t('quickRecord')}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/app/upload">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="grid size-11 place-items-center rounded-lg bg-accent/10 text-accent">
                <Upload className="size-5" />
              </div>
              <span className="font-medium">{t('quickUpload')}</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('recentMeetings')}</h2>
          <Link href="/app/meetings" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            {nav('meetings')}
          </Link>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(meetings ?? []).slice(0, 4).map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
