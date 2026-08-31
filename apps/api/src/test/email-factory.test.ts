import { describe, expect, it } from 'vitest';
import { createEmailProvider, createLazyEmailProvider } from '../email/factory';
import { loadEnv } from '../env';

const base = { DATABASE_URL: 'postgres://x', SESSION_SECRET: '0123456789abcdef' };
const input = { to: 'a@b.com', name: 'A', workspaceName: 'W', activationUrl: 'u', expiresAt: 'e', locale: 'pt-BR' as const };

describe('email factory', () => {
  it('resend with keys → real provider; resend without keys → throws eagerly', () => {
    const ok = createEmailProvider(loadEnv({ ...base, EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: 're_x', EMAIL_FROM: 'L <n@d.com>' }));
    expect(ok.name).toBe('resend');
    expect(() => createEmailProvider(loadEnv({ ...base, NODE_ENV: 'production', EMAIL_PROVIDER: 'resend' }))).toThrow(/EMAIL_API_KEY/);
  });

  it('lazy wrapper boots without throwing but fails loudly on send when misconfigured', () => {
    const env = loadEnv({ ...base, NODE_ENV: 'production', EMAIL_PROVIDER: 'resend' });
    // Construction must NOT throw — the API can boot for the core pipeline.
    const lazy = createLazyEmailProvider(() => createEmailProvider(env));
    expect(lazy.name).toBe('unconfigured');
    // An actual send builds the provider and re-raises the config error (no silent console).
    expect(() => lazy.sendInvitation(input)).toThrow(/EMAIL_API_KEY/);
  });

  it('lazy wrapper delegates to the real provider when configured', async () => {
    const env = loadEnv({ ...base, EMAIL_PROVIDER: 'console' });
    const lazy = createLazyEmailProvider(() => createEmailProvider(env));
    const res = await lazy.sendInvitation(input);
    expect(res.ok).toBe(true);
    expect(lazy.name).toBe('console');
  });
});
