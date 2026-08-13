'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Flag, Mic, Pause, Play, Square } from 'lucide-react';
import { Button, Card, CardContent, Input, Label } from '@loquia/ui';
import { useRecorder } from '@/lib/use-recorder';
import { formatDuration } from '@/lib/format';
import { Waveform } from './waveform';

const PERMISSION_ERROR_KEYS: Record<string, string> = {
  permission_denied: 'permissionDenied',
  device_missing: 'deviceMissing',
  device_disconnected: 'deviceDisconnected',
  unsupported: 'unsupported',
  error: 'error',
};

const FINISH_ERROR_KEYS: Record<string, string> = {
  upload_intent_failed: 'errorUploadIntent',
  local_quota_exceeded: 'errorQuota',
  processing_upload_failed: 'errorProcessingUpload',
};

export function Recorder() {
  const t = useTranslations('recorder');
  const rec = useTranslations('recording');
  const recorder = useRecorder();
  const { runState, elapsedSeconds, liveWaveform, permission, markers } = recorder;
  const [title, setTitle] = useState('');
  const [language] = useState('pt-BR');

  const recording = runState === 'recording';
  const paused = runState === 'paused';
  const active = recording || paused;

  // Keyboard shortcuts: Space (pause/resume), Cmd/Ctrl+M (marker), Cmd/Ctrl+Enter (finish).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!active) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        recording ? recorder.pause() : recorder.resume();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        recorder.addMarker();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void recorder.finish();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, recording, recorder]);

  const errorKey = PERMISSION_ERROR_KEYS[permission];

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {!active && (
          <div className="space-y-1.5">
            <Label htmlFor="rec-title">{t('title')}</Label>
            <Input
              id="rec-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Roadmap Q3"
            />
          </div>
        )}

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="font-mono text-5xl tabular-nums" aria-live="polite">
            {formatDuration(elapsedSeconds)}
          </div>
          <Waveform peaks={active ? liveWaveform : []} live={recording} className="h-16 w-full max-w-md" />
          {markers.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {markers.length} {t('marker')}
            </p>
          )}
          {active && (
            <p className="text-sm font-medium text-muted-foreground">
              {recording ? t('recording') : t('paused')}
            </p>
          )}
        </div>

        {errorKey && (
          <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {t(errorKey)}
          </p>
        )}

        {recorder.error && (
          <div role="alert" className="space-y-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <p>{rec(FINISH_ERROR_KEYS[recorder.error]!)}</p>
            {recorder.error === 'processing_upload_failed' && recorder.pendingUpload && (
              <Button size="sm" variant="outline" onClick={() => void recorder.retryProcessing()}>
                {rec('retryProcessing')}
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {!active ? (
            <Button size="lg" onClick={() => recorder.start(title, language)}>
              <Mic /> {t('start')}
            </Button>
          ) : (
            <>
              {recording ? (
                <Button variant="secondary" onClick={recorder.pause}>
                  <Pause /> {t('pause')}
                </Button>
              ) : (
                <Button variant="secondary" onClick={recorder.resume}>
                  <Play /> {t('resume')}
                </Button>
              )}
              <Button variant="outline" onClick={recorder.addMarker}>
                <Flag /> {t('marker')}
              </Button>
              <Button variant="destructive" onClick={() => void recorder.finish()}>
                <Square /> {t('finish')}
              </Button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">{t('shortcuts')}</p>
      </CardContent>
    </Card>
  );
}
