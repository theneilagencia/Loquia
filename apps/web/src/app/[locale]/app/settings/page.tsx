'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Session, Settings, Theme } from '@loquia/domain';
import { Card, CardContent, Input, Label, Skeleton } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { useTheme } from '@/lib/theme';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        {saved && <span className="text-sm text-success">{t('saved')}</span>}
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">{t('tabs.general')}</TabsTrigger>
          <TabsTrigger value="recording">{t('tabs.recording')}</TabsTrigger>
          <TabsTrigger value="export">{t('tabs.export')}</TabsTrigger>
          <TabsTrigger value="language">{t('tabs.language')}</TabsTrigger>
          <TabsTrigger value="privacy">{t('tabs.privacy')}</TabsTrigger>
          <TabsTrigger value="appearance">{t('tabs.appearance')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <SettingsCard>
            <Row label={t('general.displayName')}>
              <Input
                value={settings.general.displayName}
                onChange={(e) => patch({ general: { displayName: e.target.value } })}
                className="max-w-xs"
              />
            </Row>
            <Row label={t('general.timezone')}>
              <Input
                value={settings.general.timezone}
                onChange={(e) => patch({ general: { timezone: e.target.value } })}
                className="max-w-xs"
              />
            </Row>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="recording">
          <SettingsCard>
            <Row label={t('recording.device')}>
              <Input
                value={settings.recording.preferredDeviceLabel}
                onChange={(e) => patch({ recording: { preferredDeviceLabel: e.target.value } })}
                placeholder="Default"
                className="max-w-xs"
              />
            </Row>
            <Row label={t('recording.countdown')}>
              <Input
                type="number"
                min={0}
                max={10}
                value={settings.recording.countdownSeconds}
                onChange={(e) => patch({ recording: { countdownSeconds: Number(e.target.value) } })}
                className="max-w-24"
              />
            </Row>
            <ToggleRow
              label={t('recording.autoMarker')}
              checked={settings.recording.autoMarkerOnPause}
              onChange={(v) => patch({ recording: { autoMarkerOnPause: v } })}
            />
          </SettingsCard>
        </TabsContent>

        <TabsContent value="export">
          <SettingsCard>
            <ToggleRow
              label={t('exportPrefs.includeEvidence')}
              checked={settings.export.includeEvidenceByDefault}
              onChange={(v) => patch({ export: { includeEvidenceByDefault: v } })}
            />
            <Row label={t('exportPrefs.exportLanguage')}>
              <Input
                value={settings.export.exportLanguage}
                onChange={(e) => patch({ export: { exportLanguage: e.target.value } })}
                className="max-w-xs"
              />
            </Row>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="language">
          <SettingsCard>
            <Row label={t('language.meeting')}>
              <Input
                value={settings.language.meetingLanguage}
                onChange={(e) => patch({ language: { meetingLanguage: e.target.value } })}
                className="max-w-xs"
              />
            </Row>
            <Row label={t('language.transcript')}>
              <Input
                value={settings.language.transcriptLanguage}
                onChange={(e) => patch({ language: { transcriptLanguage: e.target.value } })}
                className="max-w-xs"
              />
            </Row>
            <Row label={t('language.export')}>
              <Input
                value={settings.language.exportLanguage}
                onChange={(e) => patch({ language: { exportLanguage: e.target.value } })}
                className="max-w-xs"
              />
            </Row>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="privacy">
          <SettingsCard>
            {/* Local First: recording storage is on-device by default; the remote
                copy is temporary. No permanent remote-retention options (§28–§30). */}
            <div className="space-y-1.5 border-b border-border/60 pb-4">
              <p className="text-sm font-medium">{t('privacy.storageTitle')}</p>
              <p className="text-sm text-foreground">{t('privacy.storagePolicy')}</p>
              <p className="text-xs text-muted-foreground">{t('privacy.storageExplain')}</p>
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
        </TabsContent>

        <TabsContent value="appearance">
          <SettingsCard>
            <Row label={t('appearance.theme')}>
              <div className="flex gap-2">
                {(['system', 'light', 'dark'] as Theme[]).map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => {
                      setTheme(th);
                      patch({ appearance: { theme: th } });
                    }}
                    className={
                      'rounded-md border px-3 py-1.5 text-sm ' +
                      (settings.appearance.theme === th
                        ? 'border-primary bg-primary/5'
                        : 'border-border')
                    }
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="divide-y divide-border pt-2">{children}</CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
      <Label>{label}</Label>
      {children}
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
    <div className="flex items-center justify-between py-4">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
