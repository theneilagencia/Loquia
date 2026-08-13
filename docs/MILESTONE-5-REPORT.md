# Milestone 5 — Controlled Production · Final Report

> Scope: transform the tested implementation into a real, secure, observable,
> end-to-end-validated production installation. **No new product features.**
> The product remains: **Gravar → Transcrever → Estruturar → Exportar**.

## Git

```
Branch:             claude/loquia-milestone-1-frontend-rnoc96
Working tree:       committed
Pushed:             YES (branch)
```

## Implementation readiness (credential-independent) — DONE

### Email (real transactional)

```
Interface:          EmailProvider (email/provider.ts)
Real adapter:       ResendEmailProvider (REST via fetch, no SDK) — first real provider
Dev/test only:      ConsoleEmailProvider (never sends, never logs token)
No silent fallback:  prod requires resend+key+from, or console explicitly (else throw)
Messages:           invitation / password_reset / more_information / rejection
Bilingual:          pt-BR + en-US (HTML + plaintext), locale-prefixed links
Best-effort:        wrappers never throw into requests; log email_sent/email_failed
Token safety:       token/link never logged
```

### Password reset (real)

```
Endpoints:          POST /forgot-password (generic, no enumeration) + POST /reset-password
Tokens:             sha256-hashed, single-use, expiring (PASSWORD_RESET_TTL_MINUTES=60)
On reset:           password re-hashed; ALL sessions revoked; audited
Web page:           /[locale]/reset-password/[token]
```

### Rate limiting + operational quotas (protection, not billing)

```
Rate limits:        auth + mutations (configurable)
MAX_MEETING_DURATION_SECONDS               (default 14400 / 4h)
MAX_ACTIVE_PROCESSING_JOBS_PER_WORKSPACE   (default 20)
MAX_AI_PACK_REGENERATIONS_PER_HOUR         (default 10)
Errors:             429 quota_exceeded (typed)
```

### Retention + cleanup

```
Policy per asset:   keep | 7d | 30d | 90d | discard_after_processing (+ expiresAt)
Derivation:         owner privacy (storeAudioAfterProcessing) + MEDIA_RETENTION_DAYS
Cleanup job:        storage FIRST, then mark deleted + audit; failure → cleanup_failed, retry
Scope:              media only — transcripts / AI Packs never deleted
Cron:               loquia-cleanup (Render cronjob, hourly)
```

### Delete meeting (robust)

```
DELETE /api/meetings/:id: storage delete FIRST (per asset), then all rows in a txn
Partial failure:    502 storage_error, rows kept for retry (no orphans)
Audit:              meeting_deleted / media_deleted
```

### Health / security / lifecycle

```
GET /health:        liveness — no dependencies
GET /ready:         DB hard gate (503 if down); queue reported (non-gating); providers not probed
Security headers:   nosniff · no-referrer · X-Frame DENY · CORP same-site · CSP · HSTS(prod)
CORS:               CORS_ORIGINS allowlist (defaults APP_URL)
Cookies:            httpOnly · sameSite=lax · secure(prod) · optional domain
Shutdown:           graceful SIGTERM/SIGINT (API + worker drain in-flight, close pools)
Pools:              bounded connection pools (API max 10, cleanup 3)
```

### Observability

```
Request IDs:        every request; surfaced in error bodies
Structured events:  processing_job_created, media_upload_completed, email_sent/failed,
                    meeting_deleted, media_deleted, cleanup_completed,
                    password_reset_requested/completed, auth_login_failed
Provider IDs:       Deepgram/Anthropic/Resend ids logged for correlation (never payloads)
Redaction:          secrets, tokens, presigned URLs, transcript & AI Pack bodies
```

### Golden transcript + integrity gate (deterministic, no credentials)

```
Fixtures:           tests/fixtures/golden-meeting(.expected).json (8 segments, pt-BR)
Evaluator:          evaluateAIPackIntegrity — generator-agnostic, validates persisted pack
Tests (5):          evidence validity=1 · decision vs suggestion · numbers/dates preserved
                    · cross-language keeps pt-BR evidence · adversarial hallucinated-id FLAGGED
```

## Gates (no external dependencies) — PASS

```
build:        PASS  (next build)
typecheck:    PASS  (tsc across all workspaces)
lint:         PASS  (next lint)
unit+integ:   PASS  (api 33 · web 17 · worker 9 · pipeline 23 · export-engine 18)
e2e (mock):   PASS  (9)
storybook:    PASS  (storybook build)
smoke:prod:   DB PASS · queue PASS · storage PASS · email/deepgram/anthropic NOT RUN
secret scan:  CLEAN (no keys/tokens in tracked files; .env.example holds names only)
```

## Live production verification — NOT RUN (credentials unavailable)

No real credentials for Render, R2, Deepgram, Anthropic, or Resend exist in this
environment. The following are therefore **honestly NOT RUN — credentials
unavailable**, never a false PASS:

```
R2 live storage smoke:        NOT RUN — credentials unavailable
Deepgram live STT smoke:      NOT RUN — credentials unavailable
Anthropic live AI Pack smoke: NOT RUN — credentials unavailable
Resend live email smoke:      NOT RUN — credentials unavailable
Render deploy (real):         NOT RUN — credentials unavailable
End-to-end live run:          NOT RUN — depends on the above
```

Each has a real, ready path: `pnpm --filter @loquia/pipeline smoke`
(Deepgram+Anthropic), `pnpm --filter @loquia/api smoke:production` (infra +
Resend email when `EMAIL_PROVIDER=resend` + `EMAIL_API_KEY` + `SMOKE_EMAIL_TO`),
and the `render.yaml` Blueprint (structurally validated). They light up the
moment real secrets are provided.

## Implementation readiness vs live verification

- **Implementation readiness: COMPLETE.** Every credential-independent hardening
  item is implemented, tested, and committed. All gates that don't need external
  secrets are green.
- **Live production verification: BLOCKED on credentials only.** Deploy + live
  provider smokes cannot run without real secrets, which do not exist in this
  environment.

## Conclusion

**MILESTONE 5 REPROVADA — produção controlada ainda possui blockers.**

The **only** remaining blockers are credentials, the real Render deploy, and the
live end-to-end validation that depends on them. There are **no code or design
blockers**: the controlled-production hardening is implemented, tested, and
committed. To flip to APROVADA, provide the R2 / Deepgram / Anthropic / Resend /
Render credentials, deploy the Blueprint, run the live smokes, and execute one
real end-to-end run (Access Request → Approval → real email → Activation → Login;
Upload → Deepgram → Transcript → Anthropic → AI Pack → Export).
