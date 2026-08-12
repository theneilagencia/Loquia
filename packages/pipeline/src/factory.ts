import { MockStorageAdapter } from './adapters/mock-storage';
import { R2StorageAdapter } from './adapters/r2-storage';
import { MockTranscriptionAdapter } from './adapters/mock-transcription';
import { DeepgramTranscriptionAdapter } from './adapters/deepgram-transcription';
import { MockAIPackGenerator } from './adapters/mock-ai-pack';
import { LLMAIPackGenerator } from './adapters/llm-ai-pack';
import type { ObjectStorageProvider } from './storage';
import type { TranscriptionProvider } from './transcription';
import type { AIPackGenerator } from './ai-pack';

/** Default AI Pack model — overridable via AI_PACK_MODEL. */
export const DEFAULT_AI_PACK_MODEL = 'claude-sonnet-5';

export interface PipelineEnv {
  NODE_ENV?: string;
  STORAGE_PROVIDER?: string;
  TRANSCRIPTION_PROVIDER?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
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

export function createStorageProvider(
  env: PipelineEnv,
  mock: { dir: string; baseUrl: string },
): ObjectStorageProvider {
  const explicit = env.STORAGE_PROVIDER;
  const resolved = explicit ?? (env.R2_ACCOUNT_ID ? 'r2' : 'mock');

  if (resolved === 'r2') {
    if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
      throw new Error('STORAGE_PROVIDER=r2 but R2_* credentials are missing');
    }
    return new R2StorageAdapter({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: env.R2_BUCKET_NAME,
    });
  }
  // Never silently fall back to mock in production.
  if (isProd(env) && explicit !== 'mock') {
    throw new Error('No object storage configured in production (set R2_* or STORAGE_PROVIDER=mock explicitly)');
  }
  return new MockStorageAdapter(mock.dir, mock.baseUrl);
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
      model: env.AI_PACK_MODEL ?? DEFAULT_AI_PACK_MODEL,
      maxRetries: env.AI_PACK_MAX_RETRIES,
    });
  }
  // Never silently fall back to mock in production.
  if (isProd(env) && explicit !== 'mock') {
    throw new Error('No AI Pack provider configured in production (set ANTHROPIC_API_KEY or AI_PACK_PROVIDER=mock explicitly)');
  }
  return new MockAIPackGenerator();
}
