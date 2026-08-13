import type {
  EmailProvider,
  InvitationEmailInput,
  MoreInformationEmailInput,
  PasswordResetEmailInput,
  RejectionEmailInput,
  SendResult,
} from './provider';

/**
 * Dev/test email provider. It NEVER sends anything and NEVER logs the token or
 * link (task §29, §39) — it only records that a send would have happened, with
 * metadata. In dev the activation/reset token is available via the API response,
 * so no link needs to appear in logs.
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console';
  private id = 0;
  /** In-memory record of sends, for assertions in tests (metadata only). */
  readonly sent: Array<{ kind: string; to: string; locale: string }> = [];

  private record(kind: string, to: string, locale: string): SendResult {
    this.id += 1;
    this.sent.push({ kind, to, locale });
    return { ok: true, id: `console-${this.id}` };
  }

  async sendInvitation(input: InvitationEmailInput): Promise<SendResult> {
    return this.record('invitation', input.to, input.locale);
  }
  async sendPasswordReset(input: PasswordResetEmailInput): Promise<SendResult> {
    return this.record('password_reset', input.to, input.locale);
  }
  async sendMoreInformationRequest(input: MoreInformationEmailInput): Promise<SendResult> {
    return this.record('more_information', input.to, input.locale);
  }
  async sendRejection(input: RejectionEmailInput): Promise<SendResult> {
    return this.record('rejection', input.to, input.locale);
  }
}
