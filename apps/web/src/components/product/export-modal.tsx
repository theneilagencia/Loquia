'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import {
  AI_PACK_SECTION_KEYS,
  EXPORT_FORMATS,
  EXPORT_PRESETS,
  EXPORT_SIZES,
  type AIPackSectionKey,
  type ExportFormat,
  type ExportOptions,
  type ExportPreset,
  type ExportSize,
} from '@loquia/domain';
import { Button, Card, cn } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CopyButton } from './copy-button';

export function ExportModal({
  meetingId,
  exportLanguage,
  trigger,
}: {
  meetingId: string;
  exportLanguage: string;
  trigger: React.ReactNode;
}) {
  const t = useTranslations('export');
  const services = useServices();
  const [preset, setPreset] = useState<ExportPreset>('ai_pack');
  const [size, setSize] = useState<ExportSize>('standard');
  const [format, setFormat] = useState<ExportFormat>('md');
  const [sections, setSections] = useState<AIPackSectionKey[]>([...AI_PACK_SECTION_KEYS]);
  const [preview, setPreview] = useState('');

  const options: ExportOptions = {
    preset,
    size,
    format,
    language: exportLanguage,
    includeEvidence: true,
    ...(preset === 'custom' ? { sections } : {}),
  };

  useEffect(() => {
    let cancelled = false;
    services.exports.render(meetingId, options).then((res) => {
      if (!cancelled) setPreview(res.ok ? res.value.content : '');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, preset, size, format, exportLanguage, sections.join(',')]);

  function toggleSection(key: AIPackSectionKey) {
    setSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>TranscriptSegment → AIPack → ExportEngine</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <Field label={t('preset')}>
              <div className="grid grid-cols-2 gap-2">
                {EXPORT_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreset(p)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                      preset === p ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary',
                    )}
                  >
                    {t(`presets.${p}`)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={t('size')}>
              <Segmented options={EXPORT_SIZES} value={size} onChange={setSize} render={(s) => t(`sizes.${s}`)} />
            </Field>

            <Field label={t('format')}>
              <Segmented options={EXPORT_FORMATS} value={format} onChange={setFormat} render={(f) => f.toUpperCase()} />
            </Field>

            {preset === 'custom' && (
              <Field label={t('sections')}>
                <div className="grid grid-cols-2 gap-1.5">
                  {AI_PACK_SECTION_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-2 text-xs capitalize">
                      <input
                        type="checkbox"
                        checked={sections.includes(key)}
                        onChange={() => toggleSection(key)}
                      />
                      {key.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </Field>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{t('preview')}</p>
            <Card className="h-72 overflow-auto bg-muted/40 p-3">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                {preview}
              </pre>
            </Card>
            <div className="flex gap-2">
              <CopyButton
                variant="outline"
                className="flex-1"
                onCopy={async () => {
                  await services.exports.copyToClipboard(meetingId, options);
                }}
              >
                {t('copy')}
              </CopyButton>
              <Button
                className="flex-1"
                onClick={() => void services.exports.download(meetingId, options)}
              >
                <Download /> {t('download')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  render,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  render: (v: T) => string;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'rounded px-3 py-1 text-sm transition-colors',
            value === opt ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground',
          )}
        >
          {render(opt)}
        </button>
      ))}
    </div>
  );
}
