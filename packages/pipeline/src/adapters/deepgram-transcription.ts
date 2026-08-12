import { PipelineError } from '../errors';
import type {
  TranscriptionInput,
  TranscriptionProvider,
  TranscriptionResult,
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
}

/**
 * Deepgram prerecorded transcription with diarization (task §20). All
 * Deepgram-specific parameters are centralized here; the domain sees only
 * TranscriptionResult.
 */
export class DeepgramTranscriptionAdapter implements TranscriptionProvider {
  readonly name = 'deepgram';
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: DeepgramConfig) {
    this.model = config.model ?? 'nova-2';
    this.timeoutMs = config.timeoutMs ?? 300_000;
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const params = new URLSearchParams({
      model: this.model,
      diarize: String(input.diarize),
      punctuate: 'true',
      smart_format: 'true',
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
        headers: {
          Authorization: `Token ${this.config.apiKey}`,
          'Content-Type': input.audioUrl ? 'application/json' : input.mimeType,
        },
        body: input.audioUrl ? JSON.stringify({ url: input.audioUrl }) : input.audio,
      });
    } catch (err) {
      clearTimeout(timer);
      if ((err as Error).name === 'AbortError') {
        throw new PipelineError('provider_timeout', 'Deepgram request timed out', err);
      }
      throw new PipelineError('network', 'Deepgram request failed', err);
    }
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (res.status === 401 || res.status === 403) {
        throw new PipelineError('authorization', 'Deepgram authorization failed');
      }
      if (res.status >= 500) throw new PipelineError('provider_5xx', `Deepgram ${res.status}`);
      if (res.status === 415 || /unsupported|invalid.*(audio|media)/i.test(body)) {
        throw new PipelineError('unsupported_media', 'Deepgram rejected the media');
      }
      throw new PipelineError('provider_rejected', `Deepgram ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as DeepgramResponse;
    const channel = json.results?.channels?.[0];
    const dgWords = channel?.alternatives?.[0]?.words ?? [];
    const words: TranscriptionWord[] = dgWords.map((w) => ({
      text: w.punctuated_word ?? w.word,
      startMs: Math.round(w.start * 1000),
      endMs: Math.round(w.end * 1000),
      confidence: w.confidence,
      providerSpeaker: w.speaker,
    }));

    return {
      words,
      detectedLanguage: channel?.detected_language ?? input.languageHint,
      provider: 'deepgram',
      providerRequestId: json.metadata?.request_id,
      model: json.metadata?.models?.[0] ?? this.model,
      durationMs: json.metadata?.duration != null ? Math.round(json.metadata.duration * 1000) : undefined,
    };
  }
}
