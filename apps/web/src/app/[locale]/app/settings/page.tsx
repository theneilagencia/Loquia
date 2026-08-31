'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Session, Settings, Theme } from '@loquia/domain';
import { Input, Label, Skeleton, cn } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { useTheme } from '@/lib/theme';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const services = useServices();
  const { setTheme } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    services.auth.getSession().then((s) => {
      setSession(s);
      if (s) services.settings.get(s.user.id).then(setSettings);
    });
  }, [services]);

  async function patch(partial: Parameters<typeof services.settings.update>[1]) {
    if (!session) return;
    const next = await services.settings.update(session.user.id, partial);
    setSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!settings) return <Skeleton className="h-96" />;

  return (
    <div className="max-w-[820px] space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[clamp(26px,2.9vw,34px)] font-extrabold tracking-[-0.03em]">
          {t('title')}
        </h1>
        {saved && (
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-sage">
            {t('saved')}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <SettingsCard title={t('tabs.general')}>
          <Row label={t('general.displayName')}>
            <Input
              value={settings.general.displayName}
              onChange={(e) => patch({ general: { displayName: e.target.value } })}
              className="w-full"
            />
          </Row>
          <Row label={t('general.timezone')}>
            <Input
              value={settings.general.timezone}
              onChange={(e) => patch({ general: { timezone: e.target.value } })}
              className="w-full"
            />
          </Row>
        </SettingsCard>

        <SettingsCard title={t('tabs.recording')}>
          <Row label={t('recording.device')}>
            <Input
              value={settings.recording.preferredDeviceLabel}
              onChange={(e) => patch({ recording: { preferredDeviceLabel: e.target.value } })}
              placeholder="Default"
              className="w-full"
            />
          </Row>
          <Row label={t('recording.countdown')}>
            <Input
              type="number"
              min={0}
              max={10}
              value={settings.recording.countdownSeconds}
              onChange={(e) => patch({ recording: { countdownSeconds: Number(e.target.value) } })}
              className="w-24"
            />
          </Row>
          <ToggleRow
            label={t('recording.autoMarker')}
            checked={settings.recording.autoMarkerOnPause}
            onChange={(v) => patch({ recording: { autoMarkerOnPause: v } })}
          />
        </SettingsCard>

        <SettingsCard title={t('tabs.export')}>
          <ToggleRow
            label={t('exportPrefs.includeEvidence')}
            checked={settings.export.includeEvidenceByDefault}
            onChange={(v) => patch({ export: { includeEvidenceByDefault: v } })}
          />
          <Row label={t('exportPrefs.exportLanguage')}>
            <Input
              value={settings.export.exportLanguage}
              onChange={(e) => patch({ export: { exportLanguage: e.target.value } })}
              className="w-full"
            />
          </Row>
        </SettingsCard>

        <SettingsCard title={t('tabs.language')}>
          <Row label={t('language.meeting')}>
            <Input
              value={settings.language.meetingLanguage}
              onChange={(e) => patch({ language: { meetingLanguage: e.target.value } })}
              className="w-full"
            />
          </Row>
          <Row label={t('language.transcript')}>
            <Input
              value={settings.language.transcriptLanguage}
              onChange={(e) => patch({ language: { transcriptLanguage: e.target.value } })}
              className="w-full"
            />
          </Row>
          <Row label={t('language.export')}>
            <Input
              value={settings.language.exportLanguage}
              onChange={(e) => patch({ language: { exportLanguage: e.target.value } })}
              className="w-full"
            />
          </Row>
        </SettingsCard>

        <SettingsCard title={t('tabs.privacy')}>
          {/* Local First: recording storage is on-device by default; the remote
              copy is temporary. No permanent remote-retention options (§28–§30). */}
          <div className="py-4">
            <p className="text-[14.5px] font-semibold text-ink">{t('privacy.storageTitle')}</p>
            <p className="mt-1 text-sm text-ink">{t('privacy.storagePolicy')}</p>
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
              {t('privacy.storageExplain')}
            </p>
          </div>
          <ToggleRow
            label={t('privacy.analytics')}
            checked={settings.privacy.analyticsOptIn}
            onChange={(v) => patch({ privacy: { analyticsOptIn: v } })}
          />
          <ToggleRow
            label={t('privacy.redact')}
            checked={settings.privacy.redactEmailsInExports}
            onChange={(v) => patch({ privacy: { redactEmailsInExports: v } })}
          />
        </SettingsCard>

        <SettingsCard title={t('tabs.appearance')}>
          <Row label={t('appearance.theme')}>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {(['system', 'light', 'dark'] as Theme[]).map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => {
                    setTheme(th);
                    patch({ appearance: { theme: th } });
                  }}
                  className={cn(
                    'rounded-lg border px-3.5 py-2 text-[13.5px] font-semibold capitalize transition-colors',
                    settings.appearance.theme === th
                      ? 'border-iris bg-iris-soft text-iris-strong'
                      : 'border-border bg-surface text-ink hover:border-border-strong',
                  )}
                >
                  {th === 'system' ? t('appearance.theme') : th}
                </button>
              ))}
            </div>
          </Row>
          <ToggleRow
            label={t('appearance.reducedMotion')}
            checked={settings.appearance.reducedMotion}
            onChange={(v) => patch({ appearance: { reducedMotion: v } })}
          />
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </div>
      <div className="divide-y divide-border border-t border-border">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <Label className="flex-1 text-[14.5px] font-semibold text-ink sm:min-w-[210px]">
        {label}
      </Label>
      <div className="w-full sm:w-[246px]">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-4">
      <Label className="text-[14.5px] font-semibold text-ink">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
