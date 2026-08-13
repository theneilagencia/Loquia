import type { AppContext } from '../context';
import { emailLocale, type EmailLocale } from '../email/provider';

/**
 * Transactional notifications. These wrap the email provider so routes never
 * build provider payloads or log tokens/links. Sending is best-effort: a failed
 * send is logged (event `email_failed`) and returns false, but never throws into
 * the request path — the admin can resend. Links point at the real app domain
 * (env.APP_URL) with a locale prefix.
 */
export interface Logger {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  warn: (obj: Record<string, unknown>, msg?: string) => void;
}

function fmtExpiry(iso: Date, locale: EmailLocale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(iso) + ' UTC';
}

function logSent(log: Logger, kind: string, to: string, provider: string, id: string | undefined): void {
  log.info({ event: 'email_sent', kind, to, provider, providerId: id }, 'email sent');
}
function logFailed(log: Logger, kind: string, to: string, provider: string, error: string | undefined): void {
  log.warn({ event: 'email_failed', kind, to, provider, error }, 'email failed');
}

export async function sendInvitationEmail(
  ctx: AppContext,
  log: Logger,
  input: { email: string; name: string; workspaceName: string; token: string; expiresAt: Date; locale: string },
): Promise<boolean> {
  const locale = emailLocale(input.locale);
  // Token appears ONLY in the link inside the email — never in logs.
  const activationUrl = `${ctx.env.APP_URL}/${locale}/activate-account/${input.token}`;
  const res = await ctx.email.sendInvitation({ to: input.email, name: input.name, workspaceName: input.workspaceName, activationUrl, expiresAt: fmtExpiry(input.expiresAt, locale), locale });
  if (res.ok) logSent(log, 'invitation', input.email, ctx.email.name, res.id);
  else logFailed(log, 'invitation', input.email, ctx.email.name, res.error);
  return res.ok;
}

export async function sendPasswordResetEmail(
  ctx: AppContext,
  log: Logger,
  input: { email: string; name?: string; token: string; expiresAt: Date; locale: string },
): Promise<boolean> {
  const locale = emailLocale(input.locale);
  const resetUrl = `${ctx.env.APP_URL}/${locale}/reset-password/${input.token}`;
  const res = await ctx.email.sendPasswordReset({ to: input.email, name: input.name, resetUrl, expiresAt: fmtExpiry(input.expiresAt, locale), locale });
  if (res.ok) logSent(log, 'password_reset', input.email, ctx.email.name, res.id);
  else logFailed(log, 'password_reset', input.email, ctx.email.name, res.error);
  return res.ok;
}

export async function sendMoreInformationEmail(
  ctx: AppContext,
  log: Logger,
  input: { email: string; name: string; message?: string; locale: string },
): Promise<boolean> {
  const locale = emailLocale(input.locale);
  const res = await ctx.email.sendMoreInformationRequest({ to: input.email, name: input.name, message: input.message, locale });
  if (res.ok) logSent(log, 'more_information', input.email, ctx.email.name, res.id);
  else logFailed(log, 'more_information', input.email, ctx.email.name, res.error);
  return res.ok;
}

export async function sendRejectionEmail(
  ctx: AppContext,
  log: Logger,
  input: { email: string; name: string; reason?: string; locale: string },
): Promise<boolean> {
  const locale = emailLocale(input.locale);
  const res = await ctx.email.sendRejection({ to: input.email, name: input.name, reason: input.reason, locale });
  if (res.ok) logSent(log, 'rejection', input.email, ctx.email.name, res.id);
  else logFailed(log, 'rejection', input.email, ctx.email.name, res.error);
  return res.ok;
}
