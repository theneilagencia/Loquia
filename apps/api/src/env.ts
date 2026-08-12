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
  MEDIA_MOCK_DIR: z.string().default('/tmp/loquia-media'),
  PUBLIC_API_URL: z.string().optional(),
  MAX_UPLOAD_SIZE_BYTES: z.coerce.number().default(524288000),
  MEDIA_UPLOAD_URL_TTL_SECONDS: z.coerce.number().default(900),
  MEDIA_DOWNLOAD_URL_TTL_SECONDS: z.coerce.number().default(3600),
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
