import type { AIPackSectionKey } from './ai-pack';
import type { Id, ISODateString, LanguageTag } from './common';

/** Export presets (task spec §31). */
export type ExportPreset =
  | 'ai_pack'
  | 'clean_transcript'
  | 'analysis'
  | 'writing'
  | 'full_fidelity'
  | 'custom';

export const EXPORT_PRESETS: readonly ExportPreset[] = [
  'ai_pack',
  'clean_transcript',
  'analysis',
  'writing',
  'full_fidelity',
  'custom',
];

/** Export sizes (task spec §31). */
export type ExportSize = 'compact' | 'standard' | 'full';

export const EXPORT_SIZES: readonly ExportSize[] = ['compact', 'standard', 'full'];

/** Output formats (task spec §32). */
export type ExportFormat = 'md' | 'txt' | 'json';

export const EXPORT_FORMATS: readonly ExportFormat[] = ['md', 'txt', 'json'];

/**
 * A fully-resolved export request. The single ExportEngine consumes this for
 * preview, clipboard and download alike.
 */
export interface ExportOptions {
  preset: ExportPreset;
  size: ExportSize;
  format: ExportFormat;
  /** Language of the STRUCTURED output. Evidence keeps its original language. */
  language: LanguageTag;
  /** Explicit section selection; required when preset === 'custom'. */
  sections?: AIPackSectionKey[];
  /** Include the raw transcript body. */
  includeTranscript?: boolean;
  /** Include evidence quotes under AI Pack items. */
  includeEvidence?: boolean;
  /** Include timestamps in transcript output. */
  includeTimestamps?: boolean;
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
  preset: ExportPreset;
  size: ExportSize;
  format: ExportFormat;
  language: LanguageTag;
  filename: string;
  bytes: number;
  createdAt: ISODateString;
  /** How the export left the app. */
  channel: 'download' | 'clipboard';
}
