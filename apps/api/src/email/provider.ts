/**
 * Transactional email abstraction (Milestone 5). Services depend only on this
 * interface — the concrete provider (Resend, console) never leaks into routes or
 * the domain. Tokens are never logged; only provider ids and metadata are.
 */
export type EmailLocale = 'pt-BR' | 'en-US';

/** Normalize any locale string to a supported email locale (default pt-BR). */
export function emailLocale(locale: string | null | undefined): EmailLocale {
  return (locale ?? '').toLowerCase().startsWith('en') ? 'en-US' : 'pt-BR';
}

export interface SendResult {
  ok: boolean;
  /** Provider message id (safe to log/persist for troubleshooting). */
  id?: string;
  error?: string;
}

export interface InvitationEmailInput {
  to: string;
  name: string;
  workspaceName: string;
  activationUrl: string;
  expiresAt: string;
  locale: EmailLocale;
}

export interface PasswordResetEmailInput {
  to: string;
  name?: string;
  resetUrl: string;
  expiresAt: string;
  locale: EmailLocale;
}

export interface MoreInformationEmailInput {
  to: string;
  name: string;
  message?: string;
  locale: EmailLocale;
}

export interface RejectionEmailInput {
  to: string;
  name: string;
  reason?: string;
  locale: EmailLocale;
}

export interface EmailProvider {
  readonly name: string;
  sendInvitation(input: InvitationEmailInput): Promise<SendResult>;
  sendPasswordReset(input: PasswordResetEmailInput): Promise<SendResult>;
  sendMoreInformationRequest(input: MoreInformationEmailInput): Promise<SendResult>;
  sendRejection(input: RejectionEmailInput): Promise<SendResult>;
}

/** A rendered email, provider-agnostic. */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}
