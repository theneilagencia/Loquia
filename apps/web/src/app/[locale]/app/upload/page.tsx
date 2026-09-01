'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileAudio, FileText, Link2, UploadCloud, X } from 'lucide-react';
import { Button, cn } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { getLocalMediaStore } from '@/lib/local-media/provider';
import { useRouter } from '@/i18n/navigation';

const ACCEPTED = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'];
const MAX_BYTES = 200 * 1024 * 1024;
const DOC_MAX_BYTES = 25 * 1024 * 1024;

type Mode = 'audio' | 'doc' | 'link';
type Phase = 'idle' | 'uploading' | 'processing' | 'error';

/** Minimal RTF → plain text (control words/groups stripped; enough for notes). */
function rtfToText(rtf: string): string {
  return rtf
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\par[d]?\b/g, '\n')
    .replace(/\\line\b/g, '\n')
    .replace(/\\tab\b/g, '\t')
    .replace(/\{\\\*[^{}]*\}/g, '')
    .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

/** Extract text from a PDF in the browser via pdf.js. */
async function pdfToText(f: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const data = new Uint8Array(await f.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  const parts: string[] = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    parts.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '));
  }
  await loadingTask.destroy();
  return parts.join('\n\n');
}

/** Extract plain text from a picked file. .txt/.md/.csv direct; .docx (mammoth); .pdf (pdf.js); .rtf. */
async function extractText(f: File): Promise<string> {
  const name = f.name.toLowerCase();
  if (name.endsWith('.docx')) {
    const mod = await import('mammoth');
    const extractRawText = mod.extractRawText ?? mod.default.extractRawText;
    const arrayBuffer = await f.arrayBuffer();
    const result = await extractRawText({ arrayBuffer });
    return result.value;
  }
  if (name.endsWith('.pdf')) return pdfToText(f);
  if (name.endsWith('.rtf')) return rtfToText(await f.text());
  return f.text();
}

export default function UploadPage() {
  const t = useTranslations('upload');
  const services = useServices();
  const router = useRouter();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('audio');
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Doc/link mode state.
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [docName, setDocName] = useState('');
  const [busy, setBusy] = useState(false);

  // ---------------------------------------------------------------- Audio
  function validateAudio(f: File): string | null {
    const okType = ACCEPTED.includes(f.type) || /\.(mp3|wav|m4a)$/i.test(f.name);
    if (!okType) return t('invalidType');
    if (f.size > MAX_BYTES) return t('tooLarge');
    return null;
  }

  function pickAudio(f: File) {
    const validationError = validateAudio(f);
    if (validationError) {
      setError(validationError);
      setPhase('error');
      setFile(f);
      return;
    }
    setError(null);
    setFile(f);
    setPhase('uploading');
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          void finalizeAudio(f);
          return 100;
        }
        return p + 10;
      });
    }, 120);
  }

  async function finalizeAudio(f: File) {
    setPhase('processing');
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
      /* non-fatal */
    }
    router.push(`/app/meetings/${res.value.meetingId}/processing`);
  }

  // --------------------------------------------------------------- Doc/link
  async function pickDoc(f: File) {
    setError(null);
    if (f.size > DOC_MAX_BYTES) {
      setError(t('tooLarge'));
      return;
    }
    const okType = /\.(txt|md|markdown|csv|docx|pdf|rtf)$/i.test(f.name);
    if (!okType) {
      setError(t('docInvalidType'));
      return;
    }
    setBusy(true);
    try {
      const extracted = await extractText(f);
      setText(extracted);
      setDocName(f.name);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    } catch {
      setError(t('docReadError'));
    } finally {
      setBusy(false);
    }
  }

  async function submitText(payload: { text?: string; url?: string; sourceLabel?: string }) {
    setError(null);
    setBusy(true);
    setPhase('processing');
    const res = await services.media.processText({
      title: title.trim() || undefined,
      meetingLanguage: 'pt-BR',
      text: payload.text,
      url: payload.url,
      sourceLabel: payload.sourceLabel,
    });
    setBusy(false);
    if (!res.ok) {
      setPhase('idle');
      setError(t(errorKeyFor(res.error.code)));
      return;
    }
    router.push(`/app/meetings/${res.value.meetingId}/processing`);
  }

  function errorKeyFor(code: string): string {
    switch (code) {
      case 'link_invalid':
      case 'link_blocked':
        return 'linkInvalid';
      case 'link_unreachable':
      case 'link_unsupported':
      case 'link_empty':
        return 'linkUnreachable';
      case 'text_too_short':
        return 'textTooShort';
      default:
        return 'genericError';
    }
  }

  function reset() {
    setFile(null);
    setPhase('idle');
    setProgress(0);
    setError(null);
    setText('');
    setUrl('');
    setDocName('');
    setTitle('');
  }

  const showAudioProgress = mode === 'audio' && (phase === 'uploading' || phase === 'processing');

  return (
    <div className="max-w-[760px] space-y-6">
      <h1 className="text-[clamp(26px,2.9vw,34px)] font-extrabold tracking-[-0.03em]">{t('title')}</h1>

      {/* Mode switch */}
      <div className="flex flex-wrap gap-1.5 rounded-[12px] border border-border bg-surface p-1.5 shadow-card">
        {([
          { id: 'audio', label: t('modeAudio'), icon: FileAudio },
          { id: 'doc', label: t('modeDoc'), icon: FileText },
          { id: 'link', label: t('modeLink'), icon: Link2 },
        ] as const).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              reset();
            }}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-[9px] px-3.5 py-2.5 text-[13.5px] font-semibold transition-colors',
              mode === m.id ? 'bg-ink text-canvas' : 'text-muted-foreground hover:bg-canvas hover:text-ink',
            )}
          >
            <m.icon className="size-4" />
            {m.label}
          </button>
        ))}
      </div>

      {/* ---------------- Audio ---------------- */}
      {mode === 'audio' && !showAudioProgress && (
        <div>
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) pickAudio(f);
            }}
            className={cn(
              'flex w-full flex-col items-center gap-3 rounded-xl border border-dashed px-8 py-[52px] text-center shadow-card transition-all',
              dragging ? 'border-iris bg-iris-tint' : 'border-iris-line bg-surface hover:-translate-y-0.5 hover:border-iris hover:bg-iris-tint',
            )}
          >
            <UploadCloud className="size-10 text-iris" />
            <span className="text-[17px] font-bold text-ink">{t('drop')}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">MP3 · WAV · M4A</span>
            <span className="mt-2 inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-[13.5px] font-semibold text-ink">{t('select')}</span>
          </button>
          <input
            ref={audioInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickAudio(f);
            }}
          />
        </div>
      )}

      {mode === 'audio' && showAudioProgress && (
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
            <div className="h-full rounded-full bg-iris transition-all" style={{ width: `${phase === 'processing' ? 100 : progress}%` }} />
          </div>
        </div>
      )}

      {/* ---------------- Document / text ---------------- */}
      {mode === 'doc' && (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-card">
          <p className="text-[14px] leading-relaxed text-muted-foreground">{t('docHelp')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => docInputRef.current?.click()}>
              <FileText className="size-4" />
              <span className="ml-1.5">{t('docChoose')}</span>
            </Button>
            {docName && <span className="truncate text-[13px] text-muted-foreground">{docName}</span>}
            <input
              ref={docInputRef}
              type="file"
              accept=".txt,.md,.markdown,.csv,.docx,.pdf,.rtf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pickDoc(f);
              }}
            />
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className="h-11 w-full rounded-[10px] border border-border bg-canvas px-3.5 text-[14.5px] text-ink placeholder:text-faint focus-visible:border-iris focus-visible:outline-none"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('pastePlaceholder')}
            rows={12}
            className="w-full resize-y rounded-[10px] border border-border bg-canvas px-3.5 py-3 text-[14px] leading-relaxed text-ink placeholder:text-faint focus-visible:border-iris focus-visible:outline-none"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-faint">{t('charCount', { n: text.trim().length })}</span>
            <Button disabled={busy || text.trim().length < 20} onClick={() => void submitText({ text, sourceLabel: docName || undefined })}>
              {busy ? t('processing') : t('generate')}
            </Button>
          </div>
        </div>
      )}

      {/* ---------------- Link ---------------- */}
      {mode === 'link' && (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-card">
          <p className="text-[14px] leading-relaxed text-muted-foreground">{t('linkHelp')}</p>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            inputMode="url"
            className="h-11 w-full rounded-[10px] border border-border bg-canvas px-3.5 text-[14.5px] text-ink placeholder:text-faint focus-visible:border-iris focus-visible:outline-none"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className="h-11 w-full rounded-[10px] border border-border bg-canvas px-3.5 text-[14.5px] text-ink placeholder:text-faint focus-visible:border-iris focus-visible:outline-none"
          />
          <div className="flex justify-end">
            <Button disabled={busy || !/^https?:\/\/.+\..+/i.test(url.trim())} onClick={() => void submitText({ url: url.trim(), sourceLabel: url.trim() })}>
              {busy ? t('processing') : t('generate')}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {mode === 'audio' && phase === 'error' && (
        <Button size="sm" variant="outline" onClick={reset}>
          {t('remove')}
        </Button>
      )}
    </div>
  );
}
