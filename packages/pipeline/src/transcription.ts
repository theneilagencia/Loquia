/** Transcription abstraction (task §3, §20, §21). Provider-neutral domain. */

export interface TranscriptionWord {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
  /** Raw provider speaker label (e.g. 0, 1) — never a human identity. */
  providerSpeaker?: number;
}

export interface TranscriptionInput {
  /** Preferred: a short-lived download URL the provider fetches directly. */
  audioUrl?: string;
  /** Alternative: raw bytes (used by the mock adapter / small files). */
  audio?: Uint8Array;
  mimeType: string;
  /** BCP-47 language hint, or omitted for auto-detect. */
  languageHint?: string;
  diarize: boolean;
}

export interface TranscriptionResult {
  words: TranscriptionWord[];
  detectedLanguage?: string;
  provider: string;
  providerRequestId?: string;
  model?: string;
  /** Audio duration reported by the provider, if any. */
  durationMs?: number;
}

export interface TranscriptionProvider {
  readonly name: string;
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
}
