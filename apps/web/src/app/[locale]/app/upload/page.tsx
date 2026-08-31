'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileAudio, UploadCloud, X } from 'lucide-react';
import { Button, cn } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { getLocalMediaStore } from '@/lib/local-media/provider';
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
    // M5.2 direct processing: send the audio to the API (no object storage), then
    // keep a local-first copy so playback works on this device.
    const mimeType = f.type || 'audio/mpeg';
    const res = await services.media.processAudio({
      blob: f,
      title: f.name.replace(/\.[^.]+$/, ''),
      source: 'upload',
      meetingLanguage: 'pt-BR',
      filename: f.name,
      mimeType,
    });
    if (!res.ok) {
      setError(t('invalidType'));
      setPhase('error');
      return;
    }
    try {
      const session = await services.auth.getSession();
      if (session) {
        const localStore = await getLocalMediaStore(session.workspace.id);
        await localStore.save({ meetingId: res.value.meetingId, blob: f, filename: f.name, mimeType });
      }
    } catch {
      /* non-fatal: processing continues even if the local copy can't be saved */
    }
    router.push(`/app/meetings/${res.value.meetingId}/processing`);
  }

  function reset() {
    setFile(null);
    setPhase('idle');
    setProgress(0);
    setError(null);
  }

  return (
    <div className="max-w-[760px] space-y-6">
      <h1 className="text-[clamp(26px,2.9vw,34px)] font-extrabold tracking-[-0.03em]">
        {t('title')}
      </h1>

      {phase === 'idle' || phase === 'error' ? (
        <div>
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
              'flex w-full flex-col items-center gap-3 rounded-xl border border-dashed px-8 py-[52px] text-center shadow-card transition-all',
              dragging
                ? 'border-iris bg-iris-tint'
                : 'border-iris-line bg-surface hover:-translate-y-0.5 hover:border-iris hover:bg-iris-tint',
            )}
          >
            <UploadCloud className="size-10 text-iris" />
            <span className="text-[17px] font-bold text-ink">{t('drop')}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              MP3 · WAV · M4A
            </span>
            <span className="mt-2 inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-[13.5px] font-semibold text-ink">
              {t('select')}
            </span>
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
            <p role="alert" className="mt-3 text-sm text-danger">
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
        </div>
      ) : (
        <div className="space-y-5 rounded-xl border border-border bg-surface p-7 shadow-card">
          <div className="flex items-center gap-3">
            <FileAudio className="size-8 text-iris" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-ink">{file?.name}</p>
              <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted-foreground">
                {phase === 'processing' ? t('processing') : t('uploading')}
              </p>
            </div>
            <Button size="icon" variant="ghost" aria-label={t('cancel')} onClick={reset}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-track">
            <div
              className="h-full rounded-full bg-iris transition-all"
              style={{ width: `${phase === 'processing' ? 100 : progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
