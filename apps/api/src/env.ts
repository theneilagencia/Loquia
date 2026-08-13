import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().min(16).default('dev-only-session-secret-change-me'),
  APP_URL: z.string().default('http://localhost:3000'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().default(4000),
  COOKIE_DOMAIN: z.string().optional(),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // --- Media pipeline (Milestone 3) ---
  REDIS_URL: z.string().optional(),
  STORAGE_PROVIDER: z.string().optional(),
  TRANSCRIPTION_PROVIDER: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  DEEPGRAM_API_KEY: z.string().optional(),
  DEEPGRAM_MODEL: z.string().optional(),
  // --- AI Pack generation (Milestone 4) ---
  AI_PACK_PROVIDER: z.string().optional(),
  AI_PACK_MODEL: z.string().optional(),
  AI_PACK_MAX_RETRIES: z.coerce.number().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  MEDIA_MOCK_DIR: z.string().default('/tmp/loquia-media'),
  PUBLIC_API_URL: z.string().optional(),
  MAX_UPLOAD_SIZE_BYTES: z.coerce.number().default(524288000),
  MEDIA_UPLOAD_URL_TTL_SECONDS: z.coerce.number().default(900),
  MEDIA_DOWNLOAD_URL_TTL_SECONDS: z.coerce.number().default(3600),

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

  // --- Retention (Milestone 5) ---
  // Default media retention in days for users who keep audio (0 = never auto-delete).
  // Legacy under Local First: the remote copy is temporary, so this only affects
  // any pre-Local-First rows that were kept.
  MEDIA_RETENTION_DAYS: z.coerce.number().default(0),
  // Local First safety net: the maximum time a temporary remote processing copy may
  // live before the cleanup sweep force-deletes it, regardless of job state. This is
  // a second layer behind the explicit delete_processing_media job (mirror it in the
  // R2 bucket lifecycle rule). Keep it short — just enough for processing + retries.
  REMOTE_MEDIA_MAX_TTL_HOURS: z.coerce.number().default(24),

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
