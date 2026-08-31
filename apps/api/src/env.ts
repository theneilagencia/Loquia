import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().min(16).default('dev-only-session-secret-change-me'),
  APP_URL: z.string().default('http://localhost:3000'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().default(4000),
  COOKIE_DOMAIN: z.string().optional(),
  // Session-cookie SameSite. Cross-site deploys (web and API on different sites,
  // e.g. *.onrender.com subdomains) require 'none' so the browser stores/sends
  // the cookie on cross-origin fetches; same-site deploys can use 'lax'. Blank
  // falls back to 'none' in production, 'lax' otherwise.
  COOKIE_SAMESITE: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined),
    z.enum(['lax', 'none', 'strict']).optional(),
  ),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // --- Processing pipeline ---
  REDIS_URL: z.string().optional(),
  TRANSCRIPTION_PROVIDER: z.string().optional(),
  DEEPGRAM_API_KEY: z.string().optional(),
  DEEPGRAM_MODEL: z.string().optional(),
  // Shared secret that authenticates the provider's callback to our webhook (M5.2
  // async model). Required in production when TRANSCRIPTION_PROVIDER=deepgram.
  DEEPGRAM_CALLBACK_SECRET: z.string().optional(),
  // --- AI Pack generation (Milestone 4) ---
  AI_PACK_PROVIDER: z.string().optional(),
  AI_PACK_MODEL: z.string().optional(),
  AI_PACK_MAX_RETRIES: z.coerce.number().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  PUBLIC_API_URL: z.string().optional(),
  // Direct audio ingest (M5.2): max raw audio body accepted by the ingest endpoint.
  MAX_UPLOAD_SIZE_BYTES: z.coerce.number().default(524288000),
  // How long a stale ingest temp file may linger before the per-instance sweep removes it.
  TEMP_MEDIA_MAX_AGE_MS: z.coerce.number().default(3600000),

  // --- Email (Milestone 5) ---
  EMAIL_PROVIDER: z.string().optional(), // resend | console
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_REPLY_TO: z.string().optional(),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().default(60),

  // --- Operational quotas (Milestone 5; protection, not billing) ---
  MAX_MEETING_DURATION_SECONDS: z.coerce.number().default(14400), // 4h
  MAX_ACTIVE_PROCESSING_JOBS_PER_WORKSPACE: z.coerce.number().default(20),
  MAX_AI_PACK_REGENERATIONS_PER_HOUR: z.coerce.number().default(10),

  // --- Security ---
  // Comma-separated allowed origins for CORS; defaults to APP_URL.
  CORS_ORIGINS: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function loadEnv(overrides?: Partial<NodeJS.ProcessEnv>): Env {
  if (cached && !overrides) return cached;
  const parsed = schema.parse({ ...process.env, ...overrides });
  if (!overrides) cached = parsed;
  return parsed;
}

export function isProd(env: Env): boolean {
  return env.NODE_ENV === 'production';
}
