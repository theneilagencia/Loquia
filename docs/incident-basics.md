# Incident Basics — Runbook

Short, practical responses for the most likely production incidents. All commands
assume the Render dashboard + the repo scripts. Nothing here logs or exposes
secrets, tokens, transcripts, or AI Pack content.

## Triage first

1. `GET /health` — is the API process alive?
2. `GET /ready` — is Postgres up? (`checks.db`), is the queue reachable?
   (`checks.queue`, informational).
3. Check the service logs for structured events (`event: ...`) and the failing
   `requestId`.

## API down

- `/health` failing → the process is down. Check the API service logs for a crash
  at startup. A common cause is **fail-fast on missing provider credentials**
  (e.g. `EMAIL_PROVIDER=resend but EMAIL_API_KEY missing`) — set the missing
  secret in the dashboard and redeploy. This is intentional: production never
  silently degrades to a mock/console.
- `/health` OK but `/ready` 503 → Postgres is unreachable (see below).

## PostgreSQL down / unreachable

- `/ready` returns `503 { checks: { db: 'down' } }`. The API serves nothing that
  needs the DB.
- Verify the database service and `DATABASE_URL` wiring. Once the DB is back,
  `/ready` recovers on its own (no restart needed).

## Queue (Redis) down

- `/ready` still returns `ready` (queue does not gate readiness), with
  `checks.queue: 'down'`.
- Impact: new uploads can't enqueue processing jobs; existing data is unaffected.
  Restore the `loquia-queue` service; the worker reconnects automatically.

## Worker down / not processing

- Meetings stay in `processing`. Check the worker service is running and shares
  the **same** provider env as the API.
- Graceful shutdown drains in-flight jobs (SIGTERM/SIGINT), so a normal redeploy
  won't lose a job. BullMQ redelivers jobs that were interrupted mid-flight.

## Deepgram down (transcription)

- Transcription jobs fail. Transient errors requeue with bounded retries;
  persistent errors surface an honest failed state. No API impact (`/ready`
  doesn't probe Deepgram).
- When Deepgram recovers, retry by re-enqueuing the meeting's processing (or let
  the bounded retry catch it).

## Anthropic down (AI Pack)

- AI Pack generation fails but **the transcript is preserved** and still
  exportable (Clean Transcript). The meeting shows a failed AI Pack state.
- Retry AI Pack: use the regenerate action / `POST` regenerate endpoint. It
  keeps the current version until the new one lands and is rate-limited
  (`MAX_AI_PACK_REGENERATIONS_PER_HOUR`).

## R2 down (storage)

- Uploads (presigned PUT) and playback (presigned GET) fail; `/ready` stays up.
- Meeting **delete** returns `502 storage_error` and keeps the rows — retry the
  delete once R2 is back rather than orphaning objects.
- The cleanup cron logs `cleanup_failed` and leaves assets for the next run.

## Migration failure on deploy

- The API `preDeployCommand` runs `db:migrate` before the new version serves
  traffic. On failure the deploy halts and the **old version keeps serving**.
- Fix forward: correct the migration, redeploy. Never hand-edit a partially
  applied schema on the live DB.

## Stuck / stale job

- A meeting stuck in `processing` with no worker progress: confirm the worker is
  running and the queue is reachable. Re-enqueue the meeting's processing job if
  it was lost. Bounded retries prevent infinite loops.

## Resend an invitation

- Admin → resend invitation (`POST` resend), which mints a fresh token and sends
  a new `invitation` email. The old token stays single-use / expiring.

## Password reset didn't arrive

- `forgot-password` always returns `{ sent: true }` (no enumeration), so success
  ≠ delivered. Check `email_sent` / `email_failed` events (with provider id, no
  token). If `email_failed`, verify `EMAIL_API_KEY` / verified `EMAIL_FROM` in
  Resend. Tokens expire after `PASSWORD_RESET_TTL_MINUTES` (default 60).

## Rate limit / quota rejections

- `429 quota_exceeded` is protection, not a bug: too many active jobs per
  workspace, a too-long recording, or too many AI Pack regenerations this hour.
  Tune via the `MAX_*` env if a deployment legitimately needs higher ceilings.
