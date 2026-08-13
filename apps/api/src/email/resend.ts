import type {
  EmailProvider,
  InvitationEmailInput,
  MoreInformationEmailInput,
  PasswordResetEmailInput,
  RejectionEmailInput,
  RenderedEmail,
  SendResult,
} from './provider';
import { renderInvitation, renderMoreInformation, renderPasswordReset, renderRejection } from './templates';

export interface ResendConfig {
  apiKey: string;
  from: string;
  replyTo?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

/**
 * Resend transactional email (https://resend.com) via a typed fetch client — no
 * SDK, mirroring the Deepgram/Anthropic adapters. The API key stays server-side.
 * Returns the provider message id (safe to log); the token/link is never logged.
 */
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ResendConfig) {
    this.baseUrl = config.baseUrl ?? 'https://api.resend.com';
    this.timeoutMs = config.timeoutMs ?? 15_000;
  }

  private async send(to: string, email: RenderedEmail): Promise<SendResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${this.config.apiKey}` },
        body: JSON.stringify({
          from: this.config.from,
          to: [to],
          subject: email.subject,
          html: email.html,
          text: email.text,
          ...(this.config.replyTo ? { reply_to: this.config.replyTo } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return { ok: false, error: `resend ${res.status}: ${body.slice(0, 200)}` };
      }
      const json = (await res.json().catch(() => ({}))) as { id?: string };
      return { ok: true, id: json.id };
    } catch (err) {
      return { ok: false, error: (err as Error).name === 'AbortError' ? 'timeout' : (err as Error).message };
    } finally {
      clearTimeout(timer);
    }
  }

  sendInvitation(input: InvitationEmailInput): Promise<SendResult> {
    return this.send(input.to, renderInvitation(input));
  }
  sendPasswordReset(input: PasswordResetEmailInput): Promise<SendResult> {
    return this.send(input.to, renderPasswordReset(input));
  }
  sendMoreInformationRequest(input: MoreInformationEmailInput): Promise<SendResult> {
    return this.send(input.to, renderMoreInformation(input));
  }
  sendRejection(input: RejectionEmailInput): Promise<SendResult> {
    return this.send(input.to, renderRejection(input));
  }
}
