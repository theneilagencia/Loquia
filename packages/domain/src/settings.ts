import type { ExportFormat, ExportPreset, ExportSize } from './export';
import type { Id, LanguageTag, Locale, Theme } from './common';

export interface GeneralSettings {
  displayName: string;
  /** UI locale — independent from meeting/transcript/export languages. */
  uiLocale: Locale;
  timezone: string;
}

export interface RecordingSettings {
  /** Preferred input device label; empty = system default. */
  preferredDeviceLabel: string;
  countdownSeconds: number;
  autoMarkerOnPause: boolean;
  meetingLanguage: LanguageTag;
}

export interface ExportSettings {
  defaultPreset: ExportPreset;
  defaultSize: ExportSize;
  defaultFormat: ExportFormat;
  /** Structured/export language default. */
  exportLanguage: LanguageTag;
  includeEvidenceByDefault: boolean;
}

export interface LanguageSettings {
  uiLocale: Locale;
  meetingLanguage: LanguageTag;
  transcriptLanguage: LanguageTag;
  exportLanguage: LanguageTag;
}

export interface PrivacySettings {
  storeAudioAfterProcessing: boolean;
  analyticsOptIn: boolean;
  redactEmailsInExports: boolean;
}

export interface AppearanceSettings {
  theme: Theme;
  reducedMotion: boolean;
  density: 'comfortable' | 'compact';
}

export interface Settings {
  userId: Id;
  general: GeneralSettings;
  recording: RecordingSettings;
  export: ExportSettings;
  language: LanguageSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
}
