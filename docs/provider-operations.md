# Provider Operations

Loquia talks to four external provider families through small, typed adapters
behind an interface. The domain and UI never know which concrete provider is in
use, and **production never silently falls back to a mock/console** provider.

| Family        | Real provider | Dev/test | Env selector           | Factory                          |
| ------------- | ------------- | -------- | ---------------------- | -------------------------------- |
| Storage       | Cloudflare R2 | mock fs  | `STORAGE_PROVIDER`     | `pipeline` `createStorageProvider` |
| Transcription | Deepgram      | mock     | `TRANSCRIPTION_PROVIDER` | `pipeline`                     |
| AI Pack       | Anthropic     | mock     | `AI_PACK_PROVIDER`     | `pipeline`                       |
| Email         | Resend        | console  | `EMAIL_PROVIDER`       | `apps/api/src/email/factory.ts`  |

## No silent fallback

Each factory follows the same rule:

- If the env selects the real provider, its credentials are **required** — a
  missing key throws at startup (fail fast), not a downgrade to mock/console.
- The mock/console provider is only used when it is **explicitly** requested
  (`STORAGE_PROVIDER=mock`, `EMAIL_PROVIDER=console`, …) or when nothing at all
  is configured in a non-production environment.
- In production (`NODE_ENV=production`), an unset selector with no credentials is
  an error, not a mock. Mocks/console are dev/test only.

## Provider ids in logs, never payloads

Adapters return the provider's id (Deepgram request id, Anthropic message id,
Resend email id) which is logged for correlation. Payloads — audio, transcript
text, AI Pack bodies, email bodies, tokens, presigned URLs — are never logged;
the logger redacts them.

## Outage behavior

External-provider outages must not take the platform down:

- `GET /ready` checks only Postgres (hard) and reports the queue; it never probes
  R2/Deepgram/Anthropic/Resend. A provider outage keeps the API healthy.
- Transcription/AI Pack failures fail the **job**, not the API. Transient errors
  requeue with bounded retries; permanent errors (schema/empty/config) stop
  retrying and surface an honest failed state. The transcript is preserved when
  AI Pack generation fails.
- Email sends are best-effort: a send failure logs `email_failed` (with provider
  id) and never breaks the approval/reset flow that triggered it.
- Storage delete failures during meeting deletion are **retryable**: rows are
  kept and the API returns `502 storage_error` so the delete can be retried
  rather than orphaning objects.

## Live smokes

- Full provider capability smoke: `pnpm --filter @loquia/pipeline smoke`
  (Deepgram + Anthropic over non-sensitive fixtures). Reports `NOT RUN` without
  keys.
- Infra + email smoke: `pnpm --filter @loquia/api smoke:production`.

Both are honest: missing credentials → `NOT RUN`, never a false PASS.

## Update — Milestone 5.2

Object storage (R2) was removed. The provider families are now **Transcription**
(Deepgram; the API submits raw audio bytes directly), **AI Pack** (Anthropic; on
the worker), and **Email** (Resend). No storage provider, no `@aws-sdk/*`. The
"no silent fallback" rule is unchanged for the remaining providers.
