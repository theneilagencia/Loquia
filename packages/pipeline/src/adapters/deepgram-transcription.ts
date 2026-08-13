import { PipelineError } from '../errors';
import type {
  TranscriptionCallbackOutcome,
  TranscriptionProvider,
  TranscriptionResult,
  TranscriptionSubmitInput,
  TranscriptionSubmission,
  TranscriptionWord,
} from '../transcription';

export interface DeepgramConfig {
  apiKey: string;
  model?: string; // default nova-2 (Nova family, diarization-capable)
  timeoutMs?: number;
}

interface DeepgramWord {
  word: string;
  punctuated_word?: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: number;
}

interface DeepgramResponse {
  metadata?: { request_id?: string; duration?: number; models?: string[] };
  results?: {
    channels?: Array<{
      detected_language?: string;
      alternatives?: Array<{ words?: DeepgramWord[] }>;
    }>;
  };
  // Deepgram callback error shape.
  err_code?: string;
  err_msg?: string;
  error?: string;
}

/**
 * Deepgram prerecorded transcription with diarization, ASYNC/callback mode (M5.2).
 * `submit` posts the audio with `?callback=<url>` and returns the request id
 * immediately; Deepgram later POSTs the result to our webhook, mapped by
 * `parseCallback`. All Deepgram-specific parameters/shapes are centralized here.
 */
export class DeepgramTranscriptionAdapter implements TranscriptionProvider {
  readonly name = 'deepgram';
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: DeepgramConfig) {
    this.model = config.model ?? 'nova-2';
    this.timeoutMs = config.timeoutMs ?? 30_000; // submission is fast; the result comes via callback
  }

  async submit(input: TranscriptionSubmitInput): Promise<TranscriptionSubmission> {
    const params = new URLSearchParams({
      model: this.model,
      diarize: String(input.diarize),
      punctuate: 'true',
      smart_format: 'true',
      callback: input.callbackUrl,
    });
    if (input.languageHint) params.set('language', input.languageHint);
    else params.set('detect_language', 'true');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Token ${this.config.apiKey}`, 'Content-Type': input.mimeType },
        body: input.audio,
      });
    } catch (err) {
      clearTimeout(timer);
      if ((err as Error).name === 'AbortError') throw new PipelineError('provider_timeout', 'Deepgram submission timed out', err);
      throw new PipelineError('network', 'Deepgram submission failed', err);
    }
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (res.status === 401 || res.status === 403) throw new PipelineError('authorization', 'Deepgram authorization failed');
      if (res.status >= 500) throw new PipelineError('provider_5xx', `Deepgram ${res.status}`);
      if (res.status === 415 || /unsupported|invalid.*(audio|media)/i.test(body)) throw new PipelineError('unsupported_media', 'Deepgram rejected the media');
      throw new PipelineError('provider_rejected', `Deepgram ${res.status}: ${body.slice(0, 200)}`);
    }

    // Async submission returns the request id; the transcript arrives via callback.
    const json = (await res.json().catch(() => ({}))) as { request_id?: string };
    const requestId = json.request_id;
    if (!requestId) throw new PipelineError('provider_rejected', 'Deepgram did not return a request_id');
    return { providerRequestId: requestId };
  }

  callbackRequestId(payload: unknown): string | undefined {
    return (payload as DeepgramResponse | null)?.metadata?.request_id;
  }

  parseCallback(payload: unknown): TranscriptionCallbackOutcome {
    const json = payload as DeepgramResponse | null;
    if (!json) return { ok: false, category: 'provider_rejected', message: 'Empty callback payload' };
    if (json.err_code || json.err_msg || json.error) {
      return { ok: false, category: 'provider_rejected', message: json.err_msg ?? json.error ?? json.err_code ?? 'Deepgram error' };
    }
    const channel = json.results?.channels?.[0];
    const dgWords = channel?.alternatives?.[0]?.words ?? [];
    const words: TranscriptionWord[] = dgWords.map((w) => ({
      text: w.punctuated_word ?? w.word,
      startMs: Math.round(w.start * 1000),
      endMs: Math.round(w.end * 1000),
      confidence: w.confidence,
      providerSpeaker: w.speaker,
    }));
    const result: TranscriptionResult = {
      words,
      detectedLanguage: channel?.detected_language,
      provider: 'deepgram',
      providerRequestId: json.metadata?.request_id,
      model: json.metadata?.models?.[0] ?? this.model,
      durationMs: json.metadata?.duration != null ? Math.round(json.metadata.duration * 1000) : undefined,
    };
    return { ok: true, result };
  }
}
