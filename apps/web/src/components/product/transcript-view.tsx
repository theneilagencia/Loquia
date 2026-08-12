'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Flag, Pencil, Search } from 'lucide-react';
import type { Transcript } from '@loquia/domain';
import { Badge, Button, Input, Textarea, cn } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { TimestampLink } from './timestamp-link';
import { SpeakerRename } from './speaker-rename';

export function TranscriptView({
  transcript,
  onSeek,
  onChanged,
}: {
  transcript: Transcript;
  onSeek?: (seconds: number) => void;
  onChanged: () => void;
}) {
  const t = useTranslations('transcript');
  const services = useServices();
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const speakers = useMemo(
    () => new Map(transcript.speakers.map((s) => [s.id, s])),
    [transcript.speakers],
  );

  const filtered = query.trim()
    ? transcript.segments.filter((s) => s.text.toLowerCase().includes(query.toLowerCase()))
    : transcript.segments;

  async function saveEdit(segmentId: string) {
    await services.transcripts.updateSegmentText(transcript.meetingId, segmentId, draft);
    setEditingId(null);
    onChanged();
  }

  async function rename(speakerId: string, name: string) {
    await services.transcripts.renameSpeaker(transcript.meetingId, speakerId, name);
    onChanged();
  }

  async function addMarker(atSeconds: number) {
    await services.transcripts.addMarker(transcript.meetingId, {
      atSeconds,
      label: t('addMarker'),
      kind: 'user',
    });
    onChanged();
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search')}
          className="pl-9"
          aria-label={t('search')}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('noResults')}</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((segment) => {
            const speaker = speakers.get(segment.speakerId);
            const editing = editingId === segment.id;
            return (
              <li key={segment.id} className="group flex gap-3">
                <div className="w-14 shrink-0 pt-0.5">
                  <TimestampLink seconds={segment.startSeconds} onSeek={onSeek} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {speaker && <SpeakerRename speaker={speaker} onRename={(n) => rename(speaker.id, n)} />}
                    {segment.edited && (
                      <Badge variant="outline" className="text-[10px]">
                        {t('editedBadge')}
                      </Badge>
                    )}
                  </div>
                  {editing ? (
                    <div className="space-y-2">
                      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void saveEdit(segment.id)}>
                          <Check className="size-3.5" /> {t('save')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          {t('editedBadge')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={cn('text-sm leading-relaxed', query && 'transition-colors')}
                      onDoubleClick={() => {
                        setDraft(segment.text);
                        setEditingId(segment.id);
                      }}
                    >
                      {segment.text}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label={t('edit')}
                    onClick={() => {
                      setDraft(segment.text);
                      setEditingId(segment.id);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label={t('addMarker')}
                    onClick={() => void addMarker(segment.startSeconds)}
                  >
                    <Flag className="size-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
