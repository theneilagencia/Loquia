# Render Deployment

Loquia deploys as a Render Blueprint (`render.yaml`). No deploy is performed in
this milestone (no credentials in this environment); the blueprint is
structurally validated only.

## Prerequisites (set in the Render dashboard, never committed)

Provider credentials are all `sync:false` — you paste them into the dashboard:

| Secret                  | Used by            | Notes                                  |
| ----------------------- | ------------------ | -------------------------------------- |
| `R2_ACCOUNT_ID`         | api, worker, clean | Cloudflare R2                          |
| `R2_ACCESS_KEY_ID`      | api, worker, clean |                                        |
| `R2_SECRET_ACCESS_KEY`  | api, worker, clean |                                        |
| `R2_BUCKET_NAME`        | api, worker, clean |                                        |
| `DEEPGRAM_API_KEY`      | api, worker        | STT + diarization                      |
| `ANTHROPIC_API_KEY`     | api, worker        | AI Pack generation                     |
| `EMAIL_API_KEY`         | api                | Resend API key                         |
| `EMAIL_FROM`            | api                | Verified sender, e.g. `Loquia <no-reply@yourdomain.com>` |
| `EMAIL_REPLY_TO`        | api                | Optional                               |
| `APP_URL`               | api                | Public URL of `loquia-web`             |
| `PUBLIC_API_URL`        | api, worker        | Public URL of `loquia-api`             |
| `NEXT_PUBLIC_API_URL`   | web                | Public URL of `loquia-api`             |
| `CORS_ORIGINS`          | api                | Optional; defaults to `APP_URL`        |

`SESSION_SECRET` is `generateValue: true`. `DATABASE_URL` and `REDIS_URL` are
wired via `fromDatabase` / `fromService`.

## Region

Pick one region (e.g. `oregon`) and apply it uniformly to every service and the
database with a `region:` key, so API↔DB↔queue↔worker hops stay in-region. Keep
the R2 bucket in (or near) the same region. The blueprint omits `region:` so it
stays account-default — set it before the first deploy.

## Deploy order

1. Create the database + queue (they're referenced by the services).
2. Deploy `loquia-api`. Its `preDeployCommand` runs `db:migrate` before the new
   version serves traffic. Readiness is gated on `GET /ready` (DB hard check).
3. Deploy `loquia-worker` with the **same** provider env as the API.
4. Deploy `loquia-web` pointing `NEXT_PUBLIC_API_URL` at the API.
5. The `loquia-cleanup` cronjob runs hourly (`0 * * * *`).

## Migrations

`pnpm --filter @loquia/api db:migrate` applies Drizzle migrations idempotently.
It runs as the API `preDeployCommand`, so a deploy never serves a version whose
schema hasn't been applied. If a migration fails, the deploy halts and the old
version keeps serving — fix forward and redeploy (see `docs/incident-basics.md`).

## Post-deploy smoke

Run the non-destructive suite against the live infra:

```
pnpm --filter @loquia/api smoke:production
```

It checks config presence, DB `select 1`, a queue enqueue round-trip, and a
storage round-trip (real R2 PUT→HEAD→DELETE when configured). With
`EMAIL_PROVIDER=resend`, `EMAIL_API_KEY` and `SMOKE_EMAIL_TO` set, it also sends
one real password-reset email to the authorized recipient. Missing credentials
report `NOT RUN`, never a false PASS.

## Providers must be real in production

`STORAGE_PROVIDER=r2`, `TRANSCRIPTION_PROVIDER=deepgram`,
`AI_PACK_PROVIDER=anthropic`, `EMAIL_PROVIDER=resend`. If a real provider is
selected without its credentials, the process fails fast at startup rather than
silently degrading to a mock/console. See `docs/provider-operations.md`.
