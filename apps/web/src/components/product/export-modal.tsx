'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import {
  BASE_PRESETS,
  EXPORT_FORMATS,
  PACK_SIZES,
  type ExportConfig,
  type ExportFormat,
  type ExportSections,
  type PackSize,
  type PresetId,
} from '@loquia/domain';
import { defaultSections, defaultSize } from '@loquia/export-engine';
import { Button, Card, Input, cn } from '@loquia/ui';
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

const TOGGLE_KEYS: (keyof ExportSections)[] = ['instructions', 'transcript', 'evidence', 'ambiguities'];

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
  const [preset, setPreset] = useState<PresetId>('ai');
  const [size, setSize] = useState<PackSize>('standard');
  const [format, setFormat] = useState<ExportFormat>('md');
  const [sections, setSections] = useState<ExportSections>(defaultSections('ai'));
  const [writingGoal, setWritingGoal] = useState('');
  const [preview, setPreview] = useState('');

  const config: ExportConfig = useMemo(
    () => ({
      meetingId,
      preset,
      size,
      format,
      sections,
      outputLanguage: exportLanguage as ExportConfig['outputLanguage'],
      ...(preset === 'writing' && writingGoal ? { writingGoal } : {}),
    }),
    [meetingId, preset, size, format, sections, exportLanguage, writingGoal],
  );

  useEffect(() => {
    let cancelled = false;
    services.exports.render(config).then((res) => {
      if (!cancelled) setPreview(res.ok ? res.value.content : '');
    });
    return () => {
      cancelled = true;
    };
  }, [services, config]);

  function choosePreset(p: PresetId) {
    setPreset(p);
    setSections(defaultSections(p));
    setSize(defaultSize(p));
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
                {BASE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => choosePreset(p)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                      preset === p ? 'border-iris bg-iris-soft' : 'border-border hover:bg-track',
                    )}
                  >
                    {t(`presets.${p}`)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={t('size')}>
              <Segmented options={PACK_SIZES} value={size} onChange={setSize} render={(s) => t(`sizes.${s}`)} />
            </Field>

            <Field label={t('format')}>
              <Segmented options={EXPORT_FORMATS} value={format} onChange={setFormat} render={(f) => f.toUpperCase()} />
            </Field>

            <Field label={t('sections')}>
              <div className="grid grid-cols-2 gap-1.5">
                {TOGGLE_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sections[key]}
                      onChange={(e) => setSections((s) => ({ ...s, [key]: e.target.checked }))}
                    />
                    {t(`toggles.${key}`)}
                  </label>
                ))}
              </div>
            </Field>

            {preset === 'writing' && (
              <Field label={t('writingGoal')}>
                <Input
                  value={writingGoal}
                  onChange={(e) => setWritingGoal(e.target.value)}
                  placeholder={t('writingGoalPlaceholder')}
                />
              </Field>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{t('preview')}</p>
            <Card className="h-72 overflow-auto bg-track p-3">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                {preview}
              </pre>
            </Card>
            <div className="flex gap-2">
              <CopyButton
                variant="outline"
                className="flex-1"
                onCopy={async () => {
                  await services.exports.copyToClipboard(config);
                }}
              >
                {t('copy')}
              </CopyButton>
              <Button className="flex-1" onClick={() => void services.exports.download(config)}>
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
            value === opt ? 'bg-track text-foreground' : 'text-muted-foreground',
          )}
        >
          {render(opt)}
        </button>
      ))}
    </div>
  );
}
