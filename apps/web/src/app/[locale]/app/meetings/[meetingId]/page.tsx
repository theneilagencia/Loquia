'use client';

import { use, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Archive, ArrowLeft, Download, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { Button, buttonVariants, Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link, useRouter } from '@/i18n/navigation';
import { formatDate, minutesOf } from '@/lib/format';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocalRecordingPanel } from '@/components/product/local-recording-panel';
import { getLocalMediaStore } from '@/lib/local-media/provider';
import { AIPackView } from '@/components/product/ai-pack-view';
import { AiPackGenerating } from '@/components/product/ai-pack-generating';
import { TranscriptView } from '@/components/product/transcript-view';
import { MeetingStatusBadge } from '@/components/product/meeting-status-badge';
import { ExportModal } from '@/components/product/export-modal';

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = use(params);
  const t = useTranslations('meetings');
  const errors = useTranslations('errors');
  const aiPackT = useTranslations('aiPack');
  const processingT = useTranslations('processing');
  const locale = useLocale();
  const services = useServices();
  const router = useRouter();
  const [seekTo, setSeekTo] = useState<number | null>(null);

  const meetingQ = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => services.meetings.get(meetingId),
  });
  const aiPackQ = useQuery({
    queryKey: ['aiPack', meetingId, locale],
    queryFn: () => services.meetings.getAIPack(meetingId, locale),
  });
  const transcriptQ = useQuery({
    queryKey: ['transcript', meetingId],
    queryFn: () => services.transcripts.get(meetingId),
  });
  const sessionQ = useQuery({ queryKey: ['session'], queryFn: () => services.auth.getSession() });
  const workspaceId = sessionQ.data?.workspace.id;
  // Honest AI Pack generation state; polls while a job is in flight.
  const aiPackStatusQ = useQuery({
    queryKey: ['aiPackStatus', meetingId],
    queryFn: () => services.meetings.getAIPackStatus(meetingId),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === 'queued' || s === 'generating' ? 2500 : false;
    },
  });

  // When generation finishes, pull in the freshly persisted pack.
  const aiPackStatus = aiPackStatusQ.data?.status;
  useEffect(() => {
    if (aiPackStatus === 'ready') void aiPackQ.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiPackStatus]);

  const [busy, setBusy] = useState(false);
  const [aiPackError, setAiPackError] = useState<string | null>(null);
  // Surface a failed generate/regenerate (e.g. the hourly regeneration limit)
  // and ALWAYS clear busy — otherwise the button stays stuck on "generating".
  function messageFor(code: string): string {
    if (code === 'ai_pack_regenerations') return errors('regenLimit');
    if (code === 'transcript_not_ready') return errors('transcriptNotReady');
    return errors('genericError');
  }
  async function regenerate() {
    setAiPackError(null);
    setBusy(true);
    try {
      const res = await services.meetings.regenerateAIPack(meetingId);
      if (!res.ok) setAiPackError(messageFor(res.error.code));
    } finally {
      setBusy(false);
      void aiPackStatusQ.refetch();
    }
  }
  async function generate() {
    setAiPackError(null);
    setBusy(true);
    try {
      const res = await services.meetings.generateAIPack(meetingId);
      if (!res.ok) setAiPackError(messageFor(res.error.code));
    } finally {
      setBusy(false);
      void aiPackStatusQ.refetch();
    }
  }

  const meeting = meetingQ.data;

  if (meetingQ.isLoading) {
    return <Skeleton className="h-64" />;
  }
  if (!meeting) {
    return <p className="text-muted-foreground">{errors('notFoundBody')}</p>;
  }

  // Static waveform peaks — real per-sample peaks aren't computed in this
  // milestone; the player still drives seeking against the real audio element.
  const recordingPeaks = [0.3, 0.6, 0.8, 0.5, 0.9, 0.4, 0.7, 0.6];
  const showRecording = meeting.status !== 'processing';

  const meta = [
    meeting.source,
    t('durationLabel', { minutes: minutesOf(meeting.durationSeconds) }),
    t('participants', { count: meeting.participantCount }),
    formatDate(meeting.createdAt, locale),
  ].join(' · ');

  return (
    <div className="space-y-6">
      <Link
        href="/app/meetings"
        className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-iris hover:text-iris-strong"
      >
        <ArrowLeft className="size-3.5" /> {t('title')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-[280px] flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[clamp(23px,2.5vw,30px)] font-extrabold tracking-[-0.03em] text-ink">
              {meeting.title}
            </h1>
            <MeetingStatusBadge status={meeting.status} />
          </div>
          <div className="mt-2 text-[14px] text-muted-foreground">{meta}</div>
        </div>
        {meeting.status === 'ready' && (
          <ExportModal
            meetingId={meetingId}
            exportLanguage="en-US"
            trigger={
              <Button>
                <Download /> {aiPackT('export')}
              </Button>
            }
          />
        )}
      </div>

      {meeting.status === 'processing' && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-[18px] py-4 shadow-card">
          <p className="text-muted-foreground">{t('status.processing')}…</p>
          <Link
            href={`/app/meetings/${meetingId}/processing`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            {processingT('title')}
          </Link>
        </div>
      )}

      {showRecording && (
        <LocalRecordingPanel
          meetingId={meetingId}
          workspaceId={workspaceId}
          title={meeting.title}
          durationSeconds={meeting.durationSeconds}
          peaks={recordingPeaks}
          seekTo={seekTo}
          onSeeked={() => setSeekTo(null)}
        />
      )}

      {/* AI Pack is the DEFAULT tab — never Transcript (task spec §27). */}
      <Tabs defaultValue="aiPack">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0 text-muted-foreground">
          {(['aiPack', 'transcript', 'details'] as const).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="-mb-px rounded-none border-b-2 border-transparent px-4 py-2.5 text-[14.5px] data-[state=active]:border-ink data-[state=active]:bg-transparent data-[state=active]:text-ink data-[state=active]:shadow-none"
            >
              {t(`tabs.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="aiPack">
          {(() => {
            const status = aiPackStatusQ.data?.status;
            const generating = busy || status === 'queued' || status === 'generating';
            // Current pack exists → always show it; regeneration keeps it visible.
            if (aiPackQ.data) {
              return (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {generating && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-iris-line bg-iris-tint/50 px-3 py-1.5 text-xs font-medium text-iris">
                        <RefreshCw className="size-3.5 animate-spin" />
                        {aiPackT('regenerating')}
                      </span>
                    )}
                    <Button variant="outline" size="sm" disabled={generating} onClick={() => void regenerate()}>
                      <RefreshCw className="size-3.5" /> {aiPackT('regenerate')}
                    </Button>
                  </div>
                  {aiPackError && (
                    <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                      {aiPackError}
                    </p>
                  )}
                  <AIPackView pack={aiPackQ.data} onSeek={setSeekTo} />
                </div>
              );
            }
            // No pack yet — reflect the real state honestly.
            if (generating) {
              return <AiPackGenerating />;
            }
            if (status === 'failed') {
              // Out of provider credits is a billing block, not a transient error —
              // retrying won't help until credits are added, so say so and don't
              // offer a misleading "try again".
              const outOfCredits = aiPackStatusQ.data?.failureCode === 'provider_credits';
              return (
                <div className="space-y-3 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {outOfCredits ? aiPackT('failedCredits') : aiPackT('failed')}
                  </p>
                  {!outOfCredits && (
                    <Button variant="outline" size="sm" onClick={() => void generate()}>
                      <RefreshCw className="size-3.5" /> {aiPackT('retry')}
                    </Button>
                  )}
                </div>
              );
            }
            if (transcriptQ.data) {
              return (
                <div className="space-y-3 py-8 text-center">
                  <p className="text-sm text-muted-foreground">{aiPackT('notProcessed')}</p>
                  {aiPackError && <p role="alert" className="text-sm text-danger">{aiPackError}</p>}
                  <Button size="sm" onClick={() => void generate()}>
                    <Sparkles className="size-3.5" /> {aiPackT('generate')}
                  </Button>
                </div>
              );
            }
            return <p className="py-8 text-center text-sm text-muted-foreground">{aiPackT('empty')}</p>;
          })()}
        </TabsContent>

        <TabsContent value="transcript">
          {transcriptQ.data ? (
            <TranscriptView
              transcript={transcriptQ.data}
              onSeek={setSeekTo}
              onChanged={() => {
                transcriptQ.refetch();
                aiPackQ.refetch();
              }}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {aiPackT('empty')}
            </p>
          )}
        </TabsContent>

        <TabsContent value="details">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted-foreground">
              {t('tabs.details')}
            </div>
            <Detail label="ID" value={meeting.id} />
            <Detail label={t('tabs.details')} value={meeting.source} />
            <Detail
              label={t('durationLabel', { minutes: minutesOf(meeting.durationSeconds) })}
              value={t('participants', { count: meeting.participantCount })}
            />
            <Detail label="Idioma" value={meeting.meetingLanguage} />
            <Detail label="Criada" value={formatDate(meeting.createdAt, locale)} />
            <div className="flex gap-2 pt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void services.meetings.archive(meetingId).then(() => meetingQ.refetch())}
              >
                <Archive className="size-3.5" /> {t('archive')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (!window.confirm(t('deleteConfirm'))) return;
                  void (async () => {
                    // §32: deleting the meeting also removes the on-device copy.
                    if (workspaceId) {
                      try {
                        const localStore = await getLocalMediaStore(workspaceId);
                        const localAsset = localStore.getByMeeting(meetingId);
                        if (localAsset) await localStore.delete(localAsset.id);
                      } catch {
                        /* best effort */
                      }
                    }
                    const res = await services.meetings.remove(meetingId);
                    if (res.ok) router.push('/app/meetings');
                  })();
                }}
              >
                <Trash2 className="size-3.5" /> {t('delete')}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border py-2.5 text-[14px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
