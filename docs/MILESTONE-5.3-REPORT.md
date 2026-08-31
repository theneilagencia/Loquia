# Milestone 5.3 — Autonomous Deploy & Live Verification · Final Report

> Mission: do everything technically possible autonomously to put Loquia into
> controlled production and try to approve M5, without new features.

## Source

```
Branch:            claude/loquia-milestone-1-frontend-rnoc96
HEAD:              (this commit)
Working tree:      clean
Production commit: same branch (no main rewrite; no force-push)
```

## Render

```
Render access:     BLOCKED — environment egress policy
                   (api.render.com AND *.onrender.com both 403 at the CONNECT
                    tunnel; no Render credential present in the environment)
Blueprint:         render.yaml valid — web, api, worker, postgres, keyvalue
                   (no cleanup cron, no R2 env; deploy-ready)
Web:               NOT DEPLOYED — Render unreachable from this environment
API:               NOT DEPLOYED — Render unreachable from this environment
Worker:            NOT DEPLOYED — Render unreachable from this environment
Postgres:          provisioned by blueprint on deploy (migrations run in
                   preDeployCommand); verified locally + in CI
Redis:             provisioned by blueprint (keyvalue) on deploy
Migrations:        PASS locally + in CI (0001–0004 applied clean)
Health:            /health + /ready verified locally + in CI; live NOT RUN
Ready:             /ready DB-hard-gate verified; live NOT RUN
```

Per §41–§42 the one official autonomous route around the sandbox egress block is
GitHub Actions (its runners are not policy-blocked). A CI + live-verify workflow
was added and executed on clean infra (see Gates). Render's own blueprint
auto-deploy resolves the deploy once a human connects the repo, so no redundant
deploy workflow was created (§42).

## Deepgram

```
Credentials:            PRESENT via GitHub Secret DEEPGRAM_API_KEY (CI live-verify job)
Submission (async):     PASS (LIVE) — real Deepgram /v1/listen ?callback=… accepted the
                        submit and returned a real request_id
                        (CI run 33392569034, request_id=01a057d5-0373-74f1-912f-ff12fb048f33)
request_id:             persisted on the ProcessingJob (verified in tests/e2e; truncated in logs)
Callback reachability:  live NOT RUN — needs deployed public API so Deepgram can POST back
                        (submission verified live; callback loop still needs the Render deploy)
Callback authentication: IMPLEMENTED — shared-secret token (constant-time) + request_id binding
Callback idempotency:   IMPLEMENTED + tested — duplicate → no second transcript/AI-Pack job
Transcript persistence: IMPLEMENTED + tested — webhook maps + persists TranscriptSegment[]
Diarization:            IMPLEMENTED — submit sends diarize=true; segmentation maps provider
                        speakers → stable keys
Live submission:        PASS — credential valid, async submit round-trip succeeded
```

## Anthropic

```
Credentials:      MISSING (ANTHROPIC_API_KEY unset; ANTHROPIC_BASE_URL is the
                  Claude Code proxy, not an AI Pack key)
Generation:       IMPLEMENTED (worker; structured output re-validated)
Schema:           enforced (Zod) + versioned
Evidence:         segment-id anchored; hallucinated ids rejected
Cross-language:   pt-BR transcript → en-US pack keeps original evidence/numbers/dates
Integrity metrics (golden evaluator, deterministic mock):
    evidence_reference_validity = 1.0
    unsupported_claim_rate      = 0 (adversarial hallucinated id FLAGGED)
    number_preservation         = PASS ("120","150")
    date_preservation           = PASS ("12 de março"/"20 de março")
    decision_precision          = PASS (decision detected; suggestion excluded)
    explicit_vs_inferred        = NOT MEASURED (no numeric accuracy metric emitted)
Live:             NOT RUN — credentials unavailable
```

## Resend

```
Credentials:    MISSING (EMAIL_API_KEY unset)
Sender:         configured via EMAIL_FROM (sync:false); not verified (no account here)
Invitation:     IMPLEMENTED + integration-tested (approve → invitation email)
Password reset: IMPLEMENTED + integration-tested (forgot → token+email; single-use;
                revokes sessions; generic no-enumeration response)
Live:           NOT RUN — credentials unavailable
```

## Local First

```
Local persistence:      PASS (unit + e2e: survives reload)
Refresh:                PASS (e2e)
Playback:               PASS (local-only resolver)
Reprocess:              PASS (re-submits on-device recording; new request_id)
Second device:          PASS (transcript/AI Pack visible; honest audio-unavailable)
Local delete:           PASS (removes device copy; meeting/transcript/pack kept)
Permanent server audio: NONE (no object storage; temp media deleted after submission)
```

## Security

```
Secret scan:         CLEAN (no keys/tokens in tracked files; the pasted Render
                     key was used session-only and deleted; never committed)
Cookies:             httpOnly · sameSite=lax · secure-in-prod
CORS:                allowlist (CORS_ORIGINS; defaults APP_URL); never `*`
Rate limits:         auth + mutations + ingest; webhook is global:false (not throttled)
Webhook auth:        shared-secret token (constant-time) + request_id binding;
                     unknown → 404, unauthorized → 401
Workspace isolation: enforced + tested on every resource + reprocess
Upload limits/MIME:  MAX_UPLOAD_SIZE_BYTES + accepted-MIME allowlist; temp filenames
                     server-generated (no traversal)
```

## Gates (executed on clean CI infra — GitHub Actions, Postgres+Redis services)

```
migrations:  PASS      typecheck: PASS      lint: PASS
unit+integration (api/worker/pipeline/web): PASS
mock e2e:    PASS (after build-before-e2e ordering fix)
web build:   PASS      storybook: PASS      production smoke: PASS (providers NOT RUN)
live-verify (Deepgram submit): PASS — real async submit, request_id issued
               (CI run 33392569034; opt-in via [live] commit marker + GitHub Secret)
Run: GitHub Actions "CI & Live Verify" on the certified commit.
```

## Live blockers (real, remaining)

```
RESOLVED — Deepgram credential: a valid DEEPGRAM_API_KEY was added as a GitHub
          Secret and the CI live-verify job PASSED the real async submit
          (request_id issued). The remaining Deepgram gap is only the callback
          loop, which is deploy-dependent (public API URL), not credential.
BLOCKED — environment egress policy: Render unreachable from this session
          (api.render.com + *.onrender.com denied); no Render credential present.
          The sandbox also blocks api.deepgram.com — the live PASS was obtained
          via the GitHub Actions runner, which is not egress-blocked.
BLOCKED — provider configuration (remaining): ANTHROPIC_API_KEY and EMAIL_API_KEY
          not yet provided (live Anthropic + email still NOT RUN).
```

## HUMAN ACTION REQUIRED (minimum set)

```
1. Rotate the Render API key pasted earlier (treat as exposed).
2. Render → New → Blueprint → connect theneilagencia/Loquia →
   branch claude/loquia-milestone-1-frontend-rnoc96 → Apply
   (provisions all services + enables auto-deploy).
3. Set the sync:false secrets (see docs/production-deploy.md): DEEPGRAM_API_KEY,
   ANTHROPIC_API_KEY, EMAIL_API_KEY, EMAIL_FROM, APP_URL, PUBLIC_API_URL,
   NEXT_PUBLIC_API_URL (web), ANTHROPIC_API_KEY (worker).
4. After first deploy, set PUBLIC_API_URL to the API's *.onrender.com URL and
   redeploy so the Deepgram callback resolves; then run the CI "live-verify"
   job (or the local smokes) for the live golden path.
```

## Status

```
Implementation readiness: COMPLETE
Live production verification: BLOCKED (environment egress policy + provider configuration)
```

## Conclusion

**MILESTONE 5 REPROVADA — produção controlada ainda possui blockers.**

Everything technically possible from this session is done: R2 fully removed, the
M5.2 async Deepgram-callback architecture implemented and tested, a real-backend
async e2e added, all credential-independent gates executed green on clean CI
infra, the blueprint deploy-ready, and the deploy reduced to a minimal, precise
set of human actions. The only remaining blockers are environmental (the sandbox
cannot reach Render) and credential (Deepgram/Anthropic/Resend keys absent) —
neither resolvable from within this session.
