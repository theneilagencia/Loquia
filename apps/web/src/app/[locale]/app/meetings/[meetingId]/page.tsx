'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Archive, ArrowLeft, Download } from 'lucide-react';
import { Button, buttonVariants, Card, CardContent, Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link } from '@/i18n/navigation';
import { formatDate, minutesOf } from '@/lib/format';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioPlayer } from '@/components/product/audio-player';
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
  const audioUrlQ = useQuery({
    queryKey: ['audioUrl', meetingId],
    queryFn: () => services.media.getAudioUrl(meetingId),
  });

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
  // Presigned URLs from real storage are http(s); the mock provider returns a
  // `mock-audio://` URL, which falls back to simulated playback.
  const audioSrc =
    audioUrlQ.data && audioUrlQ.data.startsWith('http') ? audioUrlQ.data : undefined;
  const showAudio = Boolean(audioUrlQ.data) && meeting.status !== 'processing';

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

      {showAudio && (
        <AudioPlayer
          durationSeconds={meeting.durationSeconds}
          peaks={recordingPeaks}
          seekTo={seekTo}
          onSeeked={() => setSeekTo(null)}
          src={audioSrc}
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
          {aiPackQ.data ? (
            <AIPackView pack={aiPackQ.data} onSeek={setSeekTo} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {transcriptQ.data ? aiPackT('notProcessed') : aiPackT('empty')}
            </p>
          )}
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
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void services.meetings.archive(meetingId).then(() => meetingQ.refetch())}
                >
                  <Archive className="size-3.5" /> {t('archive')}
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
