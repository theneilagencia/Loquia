import { MockTranscriptionAdapter } from './adapters/mock-transcription';
import { DeepgramTranscriptionAdapter } from './adapters/deepgram-transcription';
import { MockAIPackGenerator } from './adapters/mock-ai-pack';
import { LLMAIPackGenerator } from './adapters/llm-ai-pack';
import type { TranscriptionProvider } from './transcription';
import type { AIPackGenerator } from './ai-pack';

/** Default AI Pack model — overridable via AI_PACK_MODEL. */
export const DEFAULT_AI_PACK_MODEL = 'claude-sonnet-5';

// M5.2: object storage (R2) removed from the MVP. The API ingests audio directly
// and submits it to the transcription provider — there is no storage provider.
export interface PipelineEnv {
  NODE_ENV?: string;
  TRANSCRIPTION_PROVIDER?: string;
  DEEPGRAM_API_KEY?: string;
  DEEPGRAM_MODEL?: string;
  AI_PACK_PROVIDER?: string;
  AI_PACK_MODEL?: string;
  AI_PACK_MAX_RETRIES?: number;
  ANTHROPIC_API_KEY?: string;
}

function isProd(env: PipelineEnv): boolean {
  return env.NODE_ENV === 'production';
}

export function createTranscriptionProvider(env: PipelineEnv): TranscriptionProvider {
  const explicit = env.TRANSCRIPTION_PROVIDER;
  const resolved = explicit ?? (env.DEEPGRAM_API_KEY ? 'deepgram' : 'mock');

  if (resolved === 'deepgram') {
    if (!env.DEEPGRAM_API_KEY) throw new Error('TRANSCRIPTION_PROVIDER=deepgram but DEEPGRAM_API_KEY is missing');
    return new DeepgramTranscriptionAdapter({ apiKey: env.DEEPGRAM_API_KEY, model: env.DEEPGRAM_MODEL });
  }
  if (isProd(env) && explicit !== 'mock') {
    throw new Error('No transcription provider configured in production (set DEEPGRAM_API_KEY or TRANSCRIPTION_PROVIDER=mock)');
  }
  return new MockTranscriptionAdapter();
}

export function createAIPackGenerator(env: PipelineEnv): AIPackGenerator {
  const explicit = env.AI_PACK_PROVIDER;
  const resolved = explicit ?? (env.ANTHROPIC_API_KEY ? 'anthropic' : 'mock');

  if (resolved === 'anthropic') {
    if (!env.ANTHROPIC_API_KEY) throw new Error('AI_PACK_PROVIDER=anthropic but ANTHROPIC_API_KEY is missing');
    return new LLMAIPackGenerator({
      apiKey: env.ANTHROPIC_API_KEY,
      // `||` (not `??`): an env var set to an empty/blank string must fall back to
      // the default, otherwise Anthropic rejects it with `model: String should have
      // at least 1 character`.
      model: env.AI_PACK_MODEL?.trim() || DEFAULT_AI_PACK_MODEL,
      maxRetries: env.AI_PACK_MAX_RETRIES,
    });
  }
  // Never silently fall back to mock in production.
  if (isProd(env) && explicit !== 'mock') {
    throw new Error('No AI Pack provider configured in production (set ANTHROPIC_API_KEY or AI_PACK_PROVIDER=mock explicitly)');
  }
  return new MockAIPackGenerator();
}
