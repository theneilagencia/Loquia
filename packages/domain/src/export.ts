import type { Id, ISODateString, LanguageTag, Locale } from './common';

/**
 * Export contracts — reconciled with the handoff (docs/ai-pack-spec.md,
 * docs/domain-types.md). A single engine renders md/txt/json from one pack.
 */

export type PresetId = 'ai' | 'transcript' | 'analysis' | 'writing' | 'full' | `custom:${string}`;

export const BASE_PRESETS: readonly Exclude<PresetId, `custom:${string}`>[] = [
  'ai',
  'transcript',
  'analysis',
  'writing',
  'full',
];

export type PackSize = 'compact' | 'standard' | 'full';
export const PACK_SIZES: readonly PackSize[] = ['compact', 'standard', 'full'];

export type ExportFormat = 'md' | 'txt' | 'json';
export const EXPORT_FORMATS: readonly ExportFormat[] = ['md', 'txt', 'json'];

/** Optional-block toggles (docs/domain-types.md ExportPreset.sections). */
export interface ExportSections {
  instructions: boolean;
  transcript: boolean;
  evidence: boolean;
  ambiguities: boolean;
}

export interface ExportConfig {
  meetingId: Id;
  preset: PresetId;
  size: PackSize;
  format: ExportFormat;
  sections: ExportSections;
  /** `preserve` keeps the meeting's language for synthesized content too. */
  outputLanguage: Locale | 'preserve';
  writingGoal?: string;
}

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  basePreset: PresetId;
  size: PackSize;
  format: ExportFormat;
  sections: ExportSections;
  includeTimestamps: boolean;
  includeSpeakers: boolean;
  isDefault: boolean;
}

export interface ExportResult {
  filename: string;
  mimeType: string;
  content: string;
  format: ExportFormat;
  bytes: number;
}

export interface ExportHistoryEntry {
  id: Id;
  meetingId: Id;
  meetingTitle: string;
  at: ISODateString;
  action: 'copied' | 'downloaded';
  preset: string;
  size: PackSize;
  format: ExportFormat;
  language: LanguageTag;
  filename?: string;
  bytes: number;
}

export const MIME_BY_FORMAT: Record<ExportFormat, string> = {
  md: 'text/markdown;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
  json: 'application/json;charset=utf-8',
};
