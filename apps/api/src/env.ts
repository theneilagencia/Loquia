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
