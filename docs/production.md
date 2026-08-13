# Production (Milestone 5) — Controlled Production

Loquia's production posture: a real, secure, observable, end-to-end installation
of the **already-built** product. No new product features are introduced in M5 —
only the hardening that makes the existing pipeline safe to run for real users.

## End-to-end flow

```
Usuário → Web (Next.js) → API (Fastify) → PostgreSQL
                                        → R2 (object storage, presigned PUT/GET)
                                        → Queue (BullMQ/Redis)
Worker ← Queue → Deepgram (STT+diarização) → TranscriptSegment[]
                → Anthropic (AI Pack) → AIPack → ExportEngine → usuário

Access Request → Admin Approval → Email real (Resend) → Invitation
              → Activation → Login
```

## Services (see `render.yaml`)

| Service          | Type      | Role                                              |
| ---------------- | --------- | ------------------------------------------------- |
| `loquia-web`     | web       | Next.js UI (`NEXT_PUBLIC_APP_MODE=api`)           |
| `loquia-api`     | web       | Fastify API; readiness gate `/ready`              |
| `loquia-worker`  | worker    | BullMQ consumer: `media_processing` + `ai_pack`   |
| `loquia-cleanup` | cronjob   | Hourly media retention cleanup                    |
| `loquia-postgres`| database  | PostgreSQL (source of truth)                      |
| `loquia-queue`   | keyvalue  | Redis-compatible queue backing (noeviction)       |

Pin every service + the database to the **same region** so intra-hop latency
stays low. See `docs/render-deployment.md`.

## Security posture

- **No silent mock/console fallback in production.** Storage, transcription, AI
  Pack and email providers throw at startup if a real provider is selected
  without credentials (or `console`/`mock` is not explicitly requested). See
  `docs/provider-operations.md`.
- **Security headers** on every response: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`,
  `Cross-Origin-Resource-Policy: same-site`,
  `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, and
  `Strict-Transport-Security` in production.
- **CORS allowlist** from `CORS_ORIGINS` (comma-separated; defaults to `APP_URL`).
- **Cookies**: `httpOnly`, `sameSite=lax`, `secure` in production, optional
  `COOKIE_DOMAIN`.
- **Rate limits** on auth and mutation routes; **operational quotas** cap abuse
  (duration, active jobs per workspace, AI Pack regenerations/hour).
- **Redaction**: the logger redacts secrets, tokens, presigned URLs, transcript
  and AI Pack content. No secret, token, transcript, or pack body is ever logged.

## Observability

- Every request carries a `requestId` (Fastify) surfaced in error bodies.
- Structured JSON events at each stage: `processing_job_created`,
  `media_upload_completed`, `email_sent`/`email_failed` (with provider id, never
  the token), `meeting_deleted`, `media_deleted`, `cleanup_completed`,
  `password_reset_requested`/`password_reset_completed`, `auth_login_failed`.
- Provider responses carry provider ids (Deepgram/Anthropic/Resend) into logs for
  correlation — never their payloads.

## Health & readiness

- `GET /health` — liveness; never touches dependencies.
- `GET /ready` — readiness; **DB is the hard gate** (503 if down). Queue is
  reported but does not fail readiness. External providers are intentionally not
  probed so a third-party outage cannot take the API down.

## Gates (this session)

```
build:        PASS  (next build)
typecheck:    PASS  (tsc across all workspaces)
lint:         PASS  (next lint)
unit+integ:   PASS  (api 33, web 17, worker 9, pipeline 23)
e2e (mock):   PASS  (9)
storybook:    PASS
smoke:prod:   DB/queue/storage PASS · providers NOT RUN (no credentials)
secret scan:  CLEAN (no secrets in tracked files)
```

## Live verification — honest status

No real credentials for Render, R2, Deepgram, Anthropic, or Resend exist in this
environment. Therefore **all live smokes and the real deploy are `NOT RUN —
credentials unavailable`** — never a false PASS. Implementation readiness is
complete and tested; live production verification is a separate, credential-gated
step. See `MILESTONE-5-REPORT.md`.
