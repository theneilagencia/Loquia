import type {
  TranscriptionCallbackOutcome,
  TranscriptionProvider,
  TranscriptionSubmitInput,
  TranscriptionSubmission,
  TranscriptionWord,
} from '../transcription';

/** Deterministic mock callback payload shape (mirrors the async provider flow). */
export interface MockCallbackPayload {
  request_id: string;
  language: string;
  /** When true, parseCallback returns a failure (to test the failed-callback path). */
  fail?: boolean;
}

let mockCounter = 0;

/**
 * Deterministic mock transcription for dev/tests (no external provider), async
 * callback model (M5.2). `submit` returns a request id; the webhook later calls
 * `parseCallback` with a MockCallbackPayload (produced by `sampleCallbackPayload`).
 * Emits diarized words (two speakers) with real timestamps so segmentation and
 * persistence are exercised end to end.
 */
export class MockTranscriptionAdapter implements TranscriptionProvider {
  readonly name = 'mock';

  async submit(_input: TranscriptionSubmitInput): Promise<TranscriptionSubmission> {
    mockCounter += 1;
    return { providerRequestId: `mock-req-${mockCounter}` };
  }

  /** A deterministic callback body the webhook can be driven with in tests/dev. */
  static sampleCallbackPayload(requestId: string, opts?: { language?: string; fail?: boolean }): MockCallbackPayload {
    return { request_id: requestId, language: opts?.language ?? 'pt-BR', fail: opts?.fail };
  }

  callbackRequestId(payload: unknown): string | undefined {
    return (payload as MockCallbackPayload | null)?.request_id;
  }

  parseCallback(payload: unknown): TranscriptionCallbackOutcome {
    const p = payload as MockCallbackPayload | null;
    if (!p || typeof p.request_id !== 'string') return { ok: false, category: 'provider_rejected', message: 'Invalid mock callback' };
    if (p.fail) return { ok: false, category: 'unsupported_media', message: 'Mock provider rejected the media' };

    const pt = (p.language ?? 'pt-BR').toLowerCase().startsWith('pt');
    const turns: { speaker: number; text: string }[] = pt
      ? [
          { speaker: 0, text: 'Bom dia a todos. Vamos começar a reunião pelo status do projeto.' },
          { speaker: 1, text: 'Claro. A descoberta terminou e encontramos três oportunidades.' },
          { speaker: 0, text: 'Ótimo. A decisão é focar na primeira oportunidade no próximo sprint.' },
          { speaker: 1, text: 'Combinado. Eu preparo os requisitos até sexta-feira.' },
        ]
      : [
          { speaker: 0, text: 'Good morning everyone. Let us start with the project status.' },
          { speaker: 1, text: 'Sure. Discovery is done and we found three opportunities.' },
          { speaker: 0, text: 'Great. The decision is to focus on the first one next sprint.' },
          { speaker: 1, text: 'Agreed. I will prepare the requirements by Friday.' },
        ];

    const words: TranscriptionWord[] = [];
    let cursorMs = 0;
    for (const turn of turns) {
      for (const token of turn.text.split(' ')) {
        const startMs = cursorMs;
        const endMs = cursorMs + 320;
        words.push({ text: token, startMs, endMs, confidence: 0.95, providerSpeaker: turn.speaker });
        cursorMs = endMs + 40;
      }
      cursorMs += 700;
    }

    return {
      ok: true,
      result: {
        words,
        detectedLanguage: pt ? 'pt-BR' : 'en-US',
        provider: 'mock',
        providerRequestId: p.request_id,
        model: 'mock-1',
        durationMs: cursorMs,
      },
    };
  }
}
