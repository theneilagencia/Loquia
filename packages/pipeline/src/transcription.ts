/**
 * Transcription abstraction (task §3, §20, §21; M5.2 async callback model). The
 * provider is used in TWO phases so no long work runs inside the API request:
 *   1. `submit(input)` sends the audio to the provider with a callback URL and
 *      returns the provider's request id immediately (the API responds now).
 *   2. the provider later POSTs the result to our webhook, which calls
 *      `parseCallback(payload)` to map it into a domain TranscriptionResult.
 * The domain never sees provider-specific request/response shapes.
 */

export interface TranscriptionWord {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
  /** Raw provider speaker label (e.g. 0, 1) — never a human identity. */
  providerSpeaker?: number;
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

/** Async submission input: raw audio bytes + the callback URL the provider will POST to. */
export interface TranscriptionSubmitInput {
  audio: Uint8Array;
  mimeType: string;
  /** BCP-47 language hint, or omitted for auto-detect. */
  languageHint?: string;
  diarize: boolean;
  /** Where the provider POSTs the finished result (already carries our auth token). */
  callbackUrl: string;
}

export interface TranscriptionSubmission {
  providerRequestId: string;
}

/** The mapped outcome of a provider callback: a domain result, or a categorized failure. */
export type TranscriptionCallbackOutcome =
  | { ok: true; result: TranscriptionResult }
  | { ok: false; category: string; message: string };

export interface TranscriptionProvider {
  readonly name: string;
  /** Phase 1: submit the audio with a callback URL; returns the provider request id. */
  submit(input: TranscriptionSubmitInput): Promise<TranscriptionSubmission>;
  /** Phase 2: map a callback payload into a domain result (or a failure). */
  parseCallback(payload: unknown): TranscriptionCallbackOutcome;
  /** The provider request id carried inside a callback payload (to bind it to a job). */
  callbackRequestId(payload: unknown): string | undefined;
}
