import type { Env } from '../env';
import { isProd } from '../env';
import { ConsoleEmailProvider } from './console';
import { ResendEmailProvider } from './resend';
import type { EmailProvider } from './provider';

/**
 * Select the email provider from env, with no silent fallback to console in
 * production (task §25/§26 analog): production must set `resend` with an API key
 * + from address, or `console` explicitly.
 */
export function createEmailProvider(env: Env): EmailProvider {
  const explicit = env.EMAIL_PROVIDER;
  const resolved = explicit ?? (env.EMAIL_API_KEY ? 'resend' : 'console');

  if (resolved === 'resend') {
    if (!env.EMAIL_API_KEY || !env.EMAIL_FROM) {
      throw new Error('EMAIL_PROVIDER=resend but EMAIL_API_KEY / EMAIL_FROM are missing');
    }
    return new ResendEmailProvider({ apiKey: env.EMAIL_API_KEY, from: env.EMAIL_FROM, replyTo: env.EMAIL_REPLY_TO });
  }
  if (isProd(env) && explicit !== 'console') {
    throw new Error('No email provider configured in production (set EMAIL_API_KEY or EMAIL_PROVIDER=console explicitly)');
  }
  return new ConsoleEmailProvider();
}

export { ConsoleEmailProvider, ResendEmailProvider };
export * from './provider';
