'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { HardDriveDownload, MonitorSmartphone, Trash2 } from 'lucide-react';
import { Button, Card, CardContent } from '@loquia/ui';
import { AudioPlayer } from './audio-player';
import { useLocalAudio, downloadFilename } from '@/lib/local-media/playback';
import { useLocalMediaStore } from '@/lib/local-media/provider';
import { extensionForMime } from '@/lib/adapters/media-recorder';

interface Props {
  meetingId: string;
  workspaceId: string | undefined;
  title: string;
  durationSeconds: number;
  peaks: number[];
  seekTo: number | null;
  onSeeked: () => void;
  onLocalDeleted?: () => void;
}

/**
 * Local First recording panel (§26–§28, §31, §45). Playback is on-device only —
 * there is no remote audio (M5.2 removed object storage). When there is no local
 * copy it shows an honest "stored on another device" state. Offers
 * save-to-computer and remove-from-this-device — neither touches the meeting,
 * transcript or AI Pack.
 */
export function LocalRecordingPanel({ meetingId, workspaceId, title, durationSeconds, peaks, seekTo, onSeeked, onLocalDeleted }: Props) {
  const t = useTranslations('recording');
  const store = useLocalMediaStore(workspaceId);
  const local = useLocalAudio(meetingId, workspaceId);
  const [busy, setBusy] = useState(false);

  const src = local.localUrl;
  const hasAudio = Boolean(src);

  async function saveToComputer() {
    if (!store || !local.asset) return;
    setBusy(true);
    try {
      const blob = await store.getBlob(local.asset.id);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename(title, extensionForMime(local.asset.mimeType));
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function removeFromDevice() {
    if (!store || !local.asset) return;
    if (!window.confirm(t('removeConfirm'))) return;
    setBusy(true);
    try {
      await store.delete(local.asset.id);
      onLocalDeleted?.();
    } finally {
      setBusy(false);
    }
  }

  // Nothing to play here and no remote copy: be honest (§18/§45).
  if (local.resolved && !hasAudio) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 pt-6 text-sm text-muted-foreground">
          <MonitorSmartphone className="size-4 shrink-0" />
          <p>{t('storedOnAnotherDevice')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {hasAudio && (
        <AudioPlayer durationSeconds={durationSeconds} peaks={peaks} seekTo={seekTo} onSeeked={onSeeked} src={src} />
      )}
      {local.source === 'local' && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <HardDriveDownload className="size-3.5" /> {t('availableOnThisDevice')}
          </span>
          <span className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={saveToComputer} disabled={busy}>
              <HardDriveDownload className="size-3.5" /> {t('saveToComputer')}
            </Button>
            <Button variant="ghost" size="sm" onClick={removeFromDevice} disabled={busy}>
              <Trash2 className="size-3.5" /> {t('removeFromDevice')}
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}
