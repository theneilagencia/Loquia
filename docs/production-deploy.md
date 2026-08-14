# Production Deploy — Autonomous Path & Minimal Human Actions

This is the turnkey path to put Loquia (Local First, M5.2 async-callback
architecture, **no object storage**) into controlled production. The code is
certified green; the only remaining inputs are credentials and a one-time Render
connection that require a human with account access.

## Architecture being deployed

```
Browser → LocalMediaStore → Loquia API
  → Deepgram (async submit, ?callback=…) → 202
  → Deepgram POST /api/webhooks/deepgram → TranscriptSegment[]
  → BullMQ (Redis) → worker → Anthropic → AI Pack
Resend (email) · PostgreSQL · Key Value (Redis). No R2 / object storage.
```

## Services (`render.yaml`)

`loquia-web`, `loquia-api`, `loquia-worker`, `loquia-postgres`, `loquia-queue`.
No cleanup cron (it only existed for R2). No dead env vars.

## Canonical production environment variables (names from `apps/api/src/env.ts`)

Auto-managed by the blueprint: `SESSION_SECRET` (generateValue),
`DEEPGRAM_CALLBACK_SECRET` (generateValue), `DATABASE_URL`, `REDIS_URL`,
`NODE_ENV`, and the non-secret defaults.

Human-supplied secrets (`sync:false`):

| Service        | Variable            | Value                                             |
| -------------- | ------------------- | ------------------------------------------------- |
| loquia-api     | `DEEPGRAM_API_KEY`  | Deepgram key                                      |
| loquia-api     | `ANTHROPIC_API_KEY` | Anthropic key                                     |
| loquia-api     | `EMAIL_API_KEY`     | Resend key (`EMAIL_PROVIDER=resend` is preset)    |
| loquia-api     | `EMAIL_FROM`        | verified sender, e.g. `Loquia <no-reply@dominio>` |
| loquia-api     | `EMAIL_REPLY_TO`    | optional                                          |
| loquia-api     | `APP_URL`           | public URL of `loquia-web`                        |
| loquia-api     | `PUBLIC_API_URL`    | public URL of `loquia-api` (used for the callback)|
| loquia-api     | `CORS_ORIGINS`      | optional; defaults to `APP_URL`                   |
| loquia-web     | `NEXT_PUBLIC_API_URL` | public URL of `loquia-api`                       |
| loquia-worker  | `ANTHROPIC_API_KEY` | Anthropic key                                     |

> The Deepgram callback URL is built at runtime as
> `${PUBLIC_API_URL}/api/webhooks/deepgram?token=${DEEPGRAM_CALLBACK_SECRET}`.
> After the first deploy assigns the API its public URL, set `PUBLIC_API_URL`
> to that URL and redeploy so callbacks resolve.

## HUMAN ACTION REQUIRED (minimum set)

These need Render/provider account access that this session does not have (the
dev sandbox egress policy also blocks Render entirely — `BLOCKED — environment
egress policy`). Everything else is automated.

```
1. Rotate the Render API key that was pasted in chat earlier (treat as exposed);
   create a fresh key if you plan to use the API/CI deploy path.
2. Render → New → Blueprint → connect github.com/theneilagencia/Loquia →
   branch claude/loquia-milestone-1-frontend-rnoc96 → Apply.
   (This provisions all services from render.yaml AND enables auto-deploy on push.)
3. Set the sync:false secrets from the table above in the Render dashboard.
4. After the first deploy, set PUBLIC_API_URL / APP_URL / NEXT_PUBLIC_API_URL to
   the assigned *.onrender.com URLs and redeploy.
```

Once step 2 is done, Render auto-deploys every push to the connected branch — no
extra deploy tooling is needed (that is why this repo does not add a deploy
workflow: native blueprint auto-deploy already resolves it).

## Verification after deploy

- `GET /health` → 200 (liveness); `GET /ready` → 200 with DB up (readiness).
- Live provider smokes (once keys exist), either locally or via CI:
  - `pnpm --filter @loquia/pipeline smoke` — Deepgram async submit + Anthropic.
  - `pnpm --filter @loquia/api smoke:production` with `EMAIL_PROVIDER=resend` +
    `EMAIL_API_KEY` + `SMOKE_EMAIL_TO` — infra + one real email.
  - GitHub Actions: run the **CI & Live Verify** workflow with `live=true` after
    adding the provider keys as GitHub Secrets (`DEEPGRAM_API_KEY`,
    `ANTHROPIC_API_KEY`, `EMAIL_API_KEY`, `EMAIL_FROM`, `SMOKE_EMAIL_TO`).
- Real golden path: login → record → local persist → process-audio → Deepgram
  callback → transcript → AI Pack → export.

## CI

`.github/workflows/ci.yml` runs the full credential-independent gate suite on
every push/PR (Postgres + Redis services): migrations, typecheck, lint,
unit/integration, mock e2e, web build, storybook, production smoke. A manual
`live-verify` job runs the provider smokes from GitHub Secrets. GitHub-hosted
runners are not behind the dev egress policy, so this is the autonomous route to
execute real verification outside the sandbox.
