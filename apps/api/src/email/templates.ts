import type {
  EmailLocale,
  InvitationEmailInput,
  MoreInformationEmailInput,
  PasswordResetEmailInput,
  RejectionEmailInput,
  RenderedEmail,
} from './provider';

/**
 * Bilingual transactional templates (pt-BR / en-US). Plain, brand-neutral HTML
 * with a text fallback. Content is respected per `user.locale` — a pt-BR user
 * never gets an English email (task §28).
 */

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#1c1b22;line-height:1.5;max-width:520px;margin:0 auto;padding:24px">
<h1 style="font-size:18px;margin:0 0 16px">${escapeHtml(title)}</h1>
${bodyHtml}
<p style="color:#6b6a75;font-size:12px;margin-top:32px">Loquia</p>
</body></html>`;
}

function button(url: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escapeHtml(url)}" style="background:#5B4AE6;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">${escapeHtml(label)}</a></p>
<p style="color:#6b6a75;font-size:13px">${escapeHtml(url)}</p>`;
}

const COPY = {
  invitation: {
    'pt-BR': (i: InvitationEmailInput) => ({
      subject: `Seu convite para a Loquia — ${i.workspaceName}`,
      lead: `Olá ${i.name}, você foi convidado(a) para o workspace <strong>${escapeHtml(i.workspaceName)}</strong> na Loquia.`,
      cta: 'Ativar minha conta',
      expiry: `Este link expira em ${i.expiresAt}. Se você não esperava este convite, ignore este e-mail.`,
    }),
    'en-US': (i: InvitationEmailInput) => ({
      subject: `Your invitation to Loquia — ${i.workspaceName}`,
      lead: `Hi ${i.name}, you've been invited to the <strong>${escapeHtml(i.workspaceName)}</strong> workspace on Loquia.`,
      cta: 'Activate my account',
      expiry: `This link expires on ${i.expiresAt}. If you weren't expecting this invitation, ignore this email.`,
    }),
  },
  reset: {
    'pt-BR': (i: PasswordResetEmailInput) => ({
      subject: 'Redefinir sua senha da Loquia',
      lead: `Recebemos um pedido para redefinir sua senha${i.name ? `, ${i.name}` : ''}.`,
      cta: 'Redefinir senha',
      expiry: `Este link é de uso único e expira em ${i.expiresAt}. Se você não fez este pedido, ignore este e-mail — sua senha continua a mesma.`,
    }),
    'en-US': (i: PasswordResetEmailInput) => ({
      subject: 'Reset your Loquia password',
      lead: `We received a request to reset your password${i.name ? `, ${i.name}` : ''}.`,
      cta: 'Reset password',
      expiry: `This link is single-use and expires on ${i.expiresAt}. If you didn't request this, ignore this email — your password is unchanged.`,
    }),
  },
} as const;

export function renderInvitation(i: InvitationEmailInput): RenderedEmail {
  const c = COPY.invitation[i.locale](i);
  const html = layout(c.subject, `<p>${c.lead}</p>${button(i.activationUrl, c.cta)}<p style="color:#6b6a75;font-size:13px">${escapeHtml(c.expiry)}</p>`);
  const text = `${c.subject}\n\n${stripTags(c.lead)}\n\n${c.cta}: ${i.activationUrl}\n\n${c.expiry}`;
  return { subject: c.subject, html, text };
}

export function renderPasswordReset(i: PasswordResetEmailInput): RenderedEmail {
  const c = COPY.reset[i.locale](i);
  const html = layout(c.subject, `<p>${c.lead}</p>${button(i.resetUrl, c.cta)}<p style="color:#6b6a75;font-size:13px">${escapeHtml(c.expiry)}</p>`);
  const text = `${c.subject}\n\n${stripTags(c.lead)}\n\n${c.cta}: ${i.resetUrl}\n\n${c.expiry}`;
  return { subject: c.subject, html, text };
}

export function renderMoreInformation(i: MoreInformationEmailInput): RenderedEmail {
  const pt = i.locale === 'pt-BR';
  const subject = pt ? 'Precisamos de mais informações — Loquia' : 'We need a bit more information — Loquia';
  const lead = pt
    ? `Olá ${i.name}, para avançar com seu pedido de acesso à Loquia precisamos de mais algumas informações.`
    : `Hi ${i.name}, to move forward with your Loquia access request we need a little more information.`;
  const msg = i.message ? `<blockquote style="border-left:3px solid #ddd;padding-left:12px;color:#4b4a55">${escapeHtml(i.message)}</blockquote>` : '';
  const html = layout(subject, `<p>${escapeHtml(lead)}</p>${msg}`);
  const text = `${subject}\n\n${lead}${i.message ? `\n\n${i.message}` : ''}`;
  return { subject, html, text };
}

export function renderRejection(i: RejectionEmailInput): RenderedEmail {
  const pt = i.locale === 'pt-BR';
  const subject = pt ? 'Atualização sobre seu pedido de acesso — Loquia' : 'Update on your access request — Loquia';
  const lead = pt
    ? `Olá ${i.name}, agradecemos o interesse na Loquia. No momento não seguiremos com seu pedido de acesso.`
    : `Hi ${i.name}, thanks for your interest in Loquia. We won't be moving forward with your access request at this time.`;
  const reason = i.reason ? `<p style="color:#4b4a55">${escapeHtml(i.reason)}</p>` : '';
  const html = layout(subject, `<p>${escapeHtml(lead)}</p>${reason}`);
  const text = `${subject}\n\n${lead}${i.reason ? `\n\n${i.reason}` : ''}`;
  return { subject, html, text };
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '');
}

export const _localeGuard: EmailLocale[] = ['pt-BR', 'en-US'];
