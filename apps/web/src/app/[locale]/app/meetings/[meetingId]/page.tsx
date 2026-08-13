'use client';

import { use, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Archive, ArrowLeft, Download, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { Button, buttonVariants, Card, CardContent, Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link, useRouter } from '@/i18n/navigation';
import { formatDate, minutesOf } from '@/lib/format';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocalRecordingPanel } from '@/components/product/local-recording-panel';
import { getLocalMediaStore } from '@/lib/local-media/provider';
import { AIPackView } from '@/components/product/ai-pack-view';
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
  async function regenerate() {
    setBusy(true);
    await services.meetings.regenerateAIPack(meetingId);
    setBusy(false);
    void aiPackStatusQ.refetch();
  }
  async function generate() {
    setBusy(true);
    await services.meetings.generateAIPack(meetingId);
    setBusy(false);
    void aiPackStatusQ.refetch();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <Link
            href="/app/meetings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> {t('title')}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-semibold">{meeting.title}</h1>
            <MeetingStatusBadge status={meeting.status} />
          </div>
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
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <p className="text-muted-foreground">{t('status.processing')}…</p>
            <Link
              href={`/app/meetings/${meetingId}/processing`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {processingT('title')}
            </Link>
          </CardContent>
        </Card>
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
        <TabsList>
          <TabsTrigger value="aiPack">{t('tabs.aiPack')}</TabsTrigger>
          <TabsTrigger value="transcript">{t('tabs.transcript')}</TabsTrigger>
          <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
        </TabsList>

        <TabsContent value="aiPack">
          {(() => {
            const status = aiPackStatusQ.data?.status;
            const generating = busy || status === 'queued' || status === 'generating';
            // Current pack exists → always show it; regeneration keeps it visible.
            if (aiPackQ.data) {
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-end gap-3">
                    {generating && (
                      <span className="text-xs text-muted-foreground">{aiPackT('regenerating')}</span>
                    )}
                    <Button variant="outline" size="sm" disabled={generating} onClick={() => void regenerate()}>
                      <RefreshCw className="size-3.5" /> {aiPackT('regenerate')}
                    </Button>
                  </div>
                  <AIPackView pack={aiPackQ.data} onSeek={setSeekTo} />
                </div>
              );
            }
            // No pack yet — reflect the real state honestly.
            if (generating) {
              return <p className="py-8 text-center text-sm text-muted-foreground">{aiPackT('generating')}</p>;
            }
            if (status === 'failed') {
              return (
                <div className="space-y-3 py-8 text-center">
                  <p className="text-sm text-muted-foreground">{aiPackT('failed')}</p>
                  <Button variant="outline" size="sm" onClick={() => void generate()}>
                    <RefreshCw className="size-3.5" /> {aiPackT('retry')}
                  </Button>
                </div>
              );
            }
            if (transcriptQ.data) {
              return (
                <div className="space-y-3 py-8 text-center">
                  <p className="text-sm text-muted-foreground">{aiPackT('notProcessed')}</p>
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
          <Card>
            <CardContent className="grid gap-3 pt-6 text-sm sm:grid-cols-2">
              <Detail label="ID" value={meeting.id} />
              <Detail label={t('tabs.details')} value={meeting.source} />
              <Detail label={t('durationLabel', { minutes: minutesOf(meeting.durationSeconds) })} value={`${meeting.participantCount}`} />
              <Detail label="Idioma" value={meeting.meetingLanguage} />
              <Detail label="Criada" value={formatDate(meeting.createdAt, locale)} />
              <div className="flex gap-2 pt-2 sm:col-span-2">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
