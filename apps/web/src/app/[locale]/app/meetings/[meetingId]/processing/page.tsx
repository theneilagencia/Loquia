'use client';

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import type { ProcessingJob } from '@loquia/domain';
import { Button, cn } from '@loquia/ui';
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
      // Poll the job (for the timeline) AND the meeting (for the redirect
      // decision). "Processing" means getting the transcript ready — NOT the AI
      // Pack. As soon as the transcript is ready (meeting.status === 'ready') we
      // move on to the meeting page, which shows AI Pack generation honestly.
      // Waiting here for the ai_pack job to complete would strand the user at
      // "Pronto para AI Pack" for the whole generation (and forever if it retries).
      const [updated, meeting] = await Promise.all([
        services.meetings.tickProcessing(meetingId),
        services.meetings.get(meetingId).catch(() => null),
      ]);
      setJob(updated);
      if (meeting && (meeting.status === 'ready' || meeting.status === 'archived')) {
        stop = true;
        clearInterval(timer);
        setTimeout(() => router.push(`/app/meetings/${meetingId}`), 500);
        return;
      }
      // A failed transcription surfaces here (retry available); the meeting is
      // marked failed too, but the job carries the error detail for the UI.
      if ((meeting && meeting.status === 'failed') || (updated && updated.status === 'failed')) {
        stop = true;
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

  const failed = job?.status === 'failed';
  const completed = job?.status === 'completed';

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-[clamp(24px,2.6vw,32px)] font-extrabold tracking-[-0.03em] text-ink">
        {t('title')}
      </h1>
      <div className="rounded-xl border border-border bg-surface p-7 shadow-card">
        {job && (
          <div className="mb-5 flex items-center gap-3">
            <span
              className={cn(
                'size-2 rounded-full',
                failed ? 'bg-danger' : completed ? 'bg-sage' : 'animate-loq-pulse bg-iris',
              )}
            />
            <span className="text-[18px] font-bold text-ink">
              {t(`status.${job.status === 'running' ? 'running' : job.status}`)}
            </span>
            <span className="flex-1" />
            <span className="font-mono text-[11.5px] text-faint">{job.progress}%</span>
          </div>
        )}

        {job ? <ProcessingTimeline job={job} /> : <p className="text-muted-foreground">…</p>}

        {failed && (
          <div className="mt-6 space-y-3 rounded-xl bg-danger-soft p-4">
            <div className="flex items-center gap-2 text-danger">
              <AlertCircle className="size-4" />
              <p className="font-medium">
                {job?.errorCode === 'no_speech' ? t('noSpeechTitle') : t('failedTitle')}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {job?.errorCode === 'no_speech' ? t('noSpeechBody') : t('failedBody')}
            </p>
            {job?.errorCode !== 'no_speech' && job?.errorMessage && (
              <p className="font-mono text-xs text-muted-foreground">{job.errorMessage}</p>
            )}
            <Button size="sm" onClick={() => void retry()}>
              {t('retry')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
