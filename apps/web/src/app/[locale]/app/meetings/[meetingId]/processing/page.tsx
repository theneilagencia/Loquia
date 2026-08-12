'use client';

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import type { ProcessingJob } from '@loquia/domain';
import { Badge, Button, Card, CardContent } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { useRouter } from '@/i18n/navigation';
import { ProcessingTimeline } from '@/components/product/processing-timeline';

export default function ProcessingPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = use(params);
  const t = useTranslations('processing');
  const services = useServices();
  const router = useRouter();
  const [job, setJob] = useState<ProcessingJob | null>(null);

  useEffect(() => {
    let stop = false;
    services.meetings.getProcessingJob(meetingId).then(setJob);
    const timer = setInterval(async () => {
      if (stop) return;
      const updated = await services.meetings.tickProcessing(meetingId);
      setJob(updated);
      if (updated && updated.status === 'completed') {
        clearInterval(timer);
        setTimeout(() => router.push(`/app/meetings/${meetingId}`), 700);
      }
      if (updated && updated.status === 'failed') {
        clearInterval(timer);
      }
    }, 900);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [services, meetingId, router]);

  async function retry() {
    const result = await services.meetings.retryProcessing(meetingId);
    if (result.ok) router.refresh();
    // Re-mount effect by navigating to the same processing route.
    router.push(`/app/meetings/${meetingId}/processing`);
    setJob(result.ok ? result.value : job);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <Card>
        <CardContent className="space-y-6 pt-6">
          {job && (
            <div className="flex items-center justify-between">
              <Badge variant={job.status === 'failed' ? 'destructive' : 'secondary'}>
                {t(`status.${job.status === 'running' ? 'running' : job.status}`)}
              </Badge>
              <span className="text-sm text-muted-foreground">{job.progress}%</span>
            </div>
          )}
          {job ? <ProcessingTimeline job={job} /> : <p className="text-muted-foreground">…</p>}

          {job?.status === 'failed' && (
            <div className="space-y-3 rounded-md bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="size-4" />
                <p className="font-medium">{t('failedTitle')}</p>
              </div>
              <p className="text-sm text-muted-foreground">{t('failedBody')}</p>
              {job.errorMessage && (
                <p className="font-mono text-xs text-muted-foreground">{job.errorMessage}</p>
              )}
              <Button size="sm" onClick={() => void retry()}>
                {t('retry')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
