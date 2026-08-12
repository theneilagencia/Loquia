'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileAudio, UploadCloud, X } from 'lucide-react';
import { Button, Card, CardContent, cn } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { useRouter } from '@/i18n/navigation';

const ACCEPTED = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'];
const MAX_BYTES = 200 * 1024 * 1024;

type Phase = 'idle' | 'validating' | 'uploading' | 'processing' | 'error';

export default function UploadPage() {
  const t = useTranslations('upload');
  const services = useServices();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function validate(f: File): string | null {
    const okType = ACCEPTED.includes(f.type) || /\.(mp3|wav|m4a)$/i.test(f.name);
    if (!okType) return t('invalidType');
    if (f.size > MAX_BYTES) return t('tooLarge');
    return null;
  }

  function pick(f: File) {
    const validationError = validate(f);
    if (validationError) {
      setError(validationError);
      setPhase('error');
      setFile(f);
      return;
    }
    setError(null);
    setFile(f);
    setPhase('uploading');
    runUpload(f);
  }

  function runUpload(f: File) {
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          void finalize(f);
          return 100;
        }
        return p + 10;
      });
    }, 120);
  }

  async function finalize(f: File) {
    setPhase('processing');
    // Real direct-upload flow: intent → PUT to storage → complete → enqueue.
    const intent = await services.media.uploadIntent({
      title: f.name.replace(/\.[^.]+$/, ''),
      source: 'upload',
      meetingLanguage: 'pt-BR',
      filename: f.name,
      mimeType: f.type || 'audio/mpeg',
      sizeBytes: f.size,
    });
    if (!intent.ok) {
      setError(t('invalidType'));
      setPhase('error');
      return;
    }
    // Direct PUT to the presigned URL (skipped when there is none, e.g. mock).
    if (intent.value.uploadUrl) {
      await fetch(intent.value.uploadUrl, {
        method: 'PUT',
        headers: intent.value.requiredHeaders,
        body: f,
      });
    }
    await services.media.completeUpload(intent.value.mediaAssetId);
    router.push(`/app/meetings/${intent.value.meetingId}/processing`);
  }

  function reset() {
    setFile(null);
    setPhase('idle');
    setProgress(0);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      {phase === 'idle' || phase === 'error' ? (
        <Card>
          <CardContent className="pt-6">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) pick(f);
              }}
              className={cn(
                'flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed p-12 text-center transition-colors',
                dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
              )}
            >
              <UploadCloud className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('drop')}</p>
              <span className="text-xs text-muted-foreground">MP3 · WAV · M4A</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".mp3,.wav,.m4a,audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pick(f);
              }}
            />
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
            {phase === 'error' && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={reset}>
                  {t('remove')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <FileAudio className="size-8 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {phase === 'processing' ? t('processing') : t('uploading')}
                </p>
              </div>
              <Button size="icon" variant="ghost" aria-label={t('cancel')} onClick={reset}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${phase === 'processing' ? 100 : progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
