import type { Settings } from '@loquia/domain';

/** Default per-user settings (server-side source of truth). */
export function defaultSettings(userId: string, locale = 'pt-BR'): Settings {
  return {
    userId,
    general: { displayName: '', uiLocale: locale as Settings['general']['uiLocale'], timezone: 'America/Sao_Paulo' },
    recording: {
      preferredDeviceLabel: '',
      countdownSeconds: 3,
      autoMarkerOnPause: true,
      meetingLanguage: locale,
    },
    export: {
      defaultPreset: 'ai',
      defaultSize: 'standard',
      defaultFormat: 'md',
      exportLanguage: 'en-US',
      includeEvidenceByDefault: true,
    },
    language: {
      uiLocale: locale as Settings['language']['uiLocale'],
      meetingLanguage: locale,
      transcriptLanguage: locale,
      exportLanguage: 'en-US',
    },
    privacy: {
      storeAudioAfterProcessing: false,
      analyticsOptIn: true,
      redactEmailsInExports: false,
    },
    appearance: { theme: 'system', reducedMotion: false, density: 'comfortable' },
  };
}
