# Loquia — Backend Architecture (Milestone 2)

The Milestone 2 foundation adds a **real** TypeScript backend behind the
existing frontend. No AI/media pipeline is implemented yet (no STT, diarization,
LLM, email, or media storage) — those are later milestones.

## Stack

- **Fastify 5** (TypeScript strict) — HTTP API
- **Drizzle ORM** + **PostgreSQL 16** (`postgres-js` driver)
- **Zod** — request validation and env parsing
- **scrypt** (node:crypto) — password hashing (no native dependency)
- **Vitest** — integration tests against a real Postgres test database
- Structured logging via Fastify/pino with secret redaction

## Monorepo

```
apps/
  web/     Next.js frontend (ApiAdapter | MockAdapter, selectable)
  api/     Fastify API  ← implemented in Milestone 2
  worker/  prepared Render worker (no pipeline)
packages/
  domain/    shared domain types (source of truth for web AND api)
  contracts/ service interfaces + Zod schemas (shared)
  export-engine/ single md/txt/json engine (shared; runs client-side)
```

The API imports `@loquia/domain` and `@loquia/contracts` — interfaces are never
duplicated between web and API.

## Database

15 tables (`apps/api/src/db/schema.ts`), migrations in
`apps/api/src/db/migrations`:

`workspaces, users, sessions, access_requests, invitations, audit_events,
meetings, participants, transcript_segments, markers, ai_packs, export_presets,
export_history, user_settings, processing_jobs`.

- IDs: server-generated UUIDs (`gen_random_uuid()`).
- Dates: `timestamptz` (UTC); the API returns ISO strings, the frontend localizes.
- Every workspace-owned row carries an explicit `workspace_id`.

Scripts (run from `apps/api`, `DATABASE_URL` set):

```
pnpm db:generate   # drizzle-kit generate (schema → SQL)
pnpm db:migrate    # apply migrations
pnpm db:check      # verify migration consistency
pnpm db:seed       # deterministic dev/test data (never real personal data)
```

## Auth & sessions

- Passwords hashed with scrypt (`scrypt$salt$hash`).
- Server-side sessions: an opaque random token is set as an **HttpOnly** cookie
  (`Secure` in production, `SameSite=lax`, expiry); the DB stores only the
  token's **sha256 hash**. Logout revokes the row; suspended/deactivated users
  are rejected even with a valid cookie.
- **Login never enumerates**: unknown email, wrong password, `pending_activation`
  and `suspended` all return an identical generic 401.

## Authorization & workspace isolation

- `requireAuth` / `requireAdmin` guards; admin = `admin` or `owner` role.
- Any workspace-owned resource is checked with `assertWorkspace` — a cross-
  workspace id resolves to **404** (never reveals existence). Covered by tests.

## Access lifecycle (transactional)

`public request → AccessRequest` (never creates a User) → admin
`start-review / request-info / approve / reject / cancel / reopen`. **Approve**
runs in a transaction: create Workspace + `pending_activation` User + Invitation
+ audit events, all-or-nothing. **Invitations** store only the token hash, are
single-use, expire, can be revoked, and **resend invalidates** the prior token.
**Activation** (transactional): validate token → set password → activate user →
accept invitation → audit → session.

## Audit

Server-side and **append-only** (`writeAudit`). Read via `GET /api/admin/audit`
(workspace-scoped, paginated). No mutation/delete endpoints exist.

## Error model

```json
{ "error": { "code": "...", "message": "...", "requestId": "...", "details": {} } }
```

Zod failures → `422 validation_error`; never returns a stack trace in production.

## Health

- `GET /health` — liveness (process up).
- `GET /ready` — readiness (Postgres reachable).

## Frontend integration (ApiAdapter)

The UI depends only on the `Services` contract. `getServices()` selects the
adapter by `NEXT_PUBLIC_APP_MODE`:

- `mock` (default) — in-browser MockAdapter (dev/tests/Storybook).
- `api` — **ApiAdapter** (`apps/web/src/lib/api`): the same `Services` over
  `fetch` with credentialed cookies. Components are unchanged.

Export rendering stays on the shared `@loquia/export-engine` client-side — the
backend does not duplicate it. The ApiAdapter fetches meeting/transcript/AI-Pack
source from the API and runs the engine locally for preview/clipboard/download,
recording export history via the API.

## What remains mock (by design, Milestone 2)

- **Transcription & AI Pack content** — demo/deterministic (no STT/LLM). The
  bilingual AI Pack source is stored as JSONB so the shared engine can render it.
  No endpoint claims real processing; the pipeline stages are simulated by
  `POST /meetings/:id/job/tick`.
- **Email** (invitations/reset) — not sent; activation tokens are surfaced via
  the approve API response for now.
- **Media upload/storage**, **queue/worker pipeline**, **STT/diarization/LLM** —
  not implemented; `loquia-worker` and `loquia-queue` are prepared only.

## Deploy (Render)

`render.yaml` (Blueprint) defines `loquia-postgres`, `loquia-api`,
`loquia-web`, `loquia-worker`, `loquia-queue`. Secrets are injected by Render
(`generateValue` / `fromDatabase` / `fromService` / `sync:false`) and never
committed. Migrations run in the API `preDeployCommand`. **No deploy has been
performed** — the blueprint is structurally validated only.

## Testing

- **Integration** (`apps/api`, Vitest + `app.inject`) against a real Postgres
  test DB (`TEST_DATABASE_URL`): auth/generic-login, session, workspace
  isolation, access lifecycle, approval transaction, invitation
  expiry/revoke/single-use/resend, activation, roles/admin authz, audit,
  meetings metadata, settings, preset persistence, ProcessingJob.
- **Real-API e2e** (`apps/web`, `playwright.api.config.ts`): browser → web (api
  mode) → API → Postgres, covering login/meetings/settings/logout and
  request→approval→activation.
