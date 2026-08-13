# Transactional Email

Loquia sends real transactional email through an `EmailProvider` interface
(`apps/api/src/email/provider.ts`). The first real provider is **Resend**;
`ConsoleEmailProvider` exists only for dev/test.

## Providers

- **`ResendEmailProvider`** (`email/resend.ts`) — typed `fetch` to the Resend
  REST API (`POST {baseUrl}/emails`, `Authorization: Bearer`), no SDK. Sends
  `from` / `to` / `subject` / `html` / `text` / `reply_to` and returns the Resend
  message id.
- **`ConsoleEmailProvider`** (`email/console.ts`) — never sends and never logs a
  token; records `{ kind, to, locale }` in an in-memory `sent[]` for test
  assertions. Returns a synthetic `console-N` id.

Selection (`email/factory.ts`): `EMAIL_PROVIDER=resend` requires `EMAIL_API_KEY`
+ `EMAIL_FROM` (throws otherwise); unset falls back to `resend` when
`EMAIL_API_KEY` is present, else `console`. **In production, console must be
requested explicitly** — there is no silent fallback.

## Messages (bilingual pt-BR / en-US)

Rendered by `email/templates.ts` (HTML + plaintext, `escapeHtml`, shared layout
and button helpers). Locale is resolved per-recipient via `emailLocale(locale)`
(defaults pt-BR).

| Kind               | Trigger                              | Link                                     |
| ------------------ | ------------------------------------ | ---------------------------------------- |
| `invitation`       | Admin approves an access request     | `${APP_URL}/${locale}/activate-account/{token}` |
| `password_reset`   | `POST /api/auth/forgot-password`     | `${APP_URL}/${locale}/reset-password/{token}`   |
| `more_information` | Admin requests more info             | — (message body)                         |
| `rejection`        | Admin rejects an access request      | — (reason body)                          |

URLs are locale-prefixed to match the web app's `[locale]` routing. Expiry is
formatted with `Intl.DateTimeFormat` in UTC.

## Safety

- Sends are **best-effort**: `sendXxxEmail` wrappers (`services/notifications.ts`)
  never throw into the request path. Success logs `email_sent` with the provider
  id; failure logs `email_failed` with the error — **never the token or link**.
- The token itself is never logged and never appears in any structured event.
- Password-reset requests are generic (`{ sent: true }`) whether or not the email
  exists — no account enumeration.

## Live smoke

`pnpm --filter @loquia/api smoke:production` sends one real password-reset email
**only** when `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, and `SMOKE_EMAIL_TO` (an
authorized recipient) are all set. Otherwise it reports `NOT RUN — credentials
unavailable`. In this environment it is **NOT RUN**.
