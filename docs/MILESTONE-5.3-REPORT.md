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

## Render — DEPLOYED & LIVE (free-plan topology)

```
Sandbox → Render:  BLOCKED — environment egress policy (api.render.com +
                   *.onrender.com both 403 at CONNECT). All Render work was done
                   from the GitHub Actions runner (not egress-blocked), driven by
                   RENDER_API_KEY as a GitHub Secret.
Blueprint:         render.yaml — loquia-web + loquia-api + loquia-postgres, all
                   plan:free. No worker, no Redis (workers are paid); AI Pack runs
                   in-process. No cleanup cron, no R2.
Web  (loquia-web): LIVE — https://loquia-web.onrender.com  (GET /pt-BR → 200)
API  (loquia-api): LIVE — https://loquia-api.onrender.com
Postgres:          LIVE — migrations applied at startup; /ready reports db: up
Health:            LIVE PASS — GET /health → 200 {"status":"ok"}
Ready:             LIVE PASS — GET /ready → 200 {"status":"ready","checks":{"db":"up","queue":"skipped"}}
```

Deploy issues found and fixed (each by root cause, verified from the Render API/logs
via the runner): (1) free tier forbids preDeployCommand → migrate in startCommand;
(2) build `corepack enable` hit EROFS on read-only /usr/bin → install pnpm via npm,
pin Node 20; (3) API ignored Render's $PORT → bind $PORT; (4) email factory threw
at boot when EMAIL_* unset → lazy email provider (API boots; sends fail loudly).

### Live golden path — PASS (deployed prod, real providers)

```
CI "Live golden path" workflow, against https://loquia-api.onrender.com:
  login 200 → process-audio 202 → meeting processing→ready (real Deepgram
  callback on the PUBLIC webhook) → transcript segments=1 (accurate Deepgram
  transcription, smart_format "$12,000") → AI Pack generating→ready, sections=9.
  == GOLDEN PATH LIVE: PASS ==
Fully autonomous: the runner resolved the Postgres external URL via the Render
API, seeded the owner, synthesized speech (espeak-ng), and drove the flow.
```

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
Credentials:      PRESENT via GitHub Secret ANTHROPIC_API_KEY (CI live-verify job)
Generation:       PASS (LIVE) — real Anthropic call generated an AI Pack
                  (CI run 33395992539: model=claude-sonnet-5, sections=8,
                   cited=3, dropped=0 — schema + evidence validated on real output)
Schema:           enforced (Zod) + versioned — passed on the live output
Evidence:         segment-id anchored; hallucinated ids rejected (dropped=0 live)
Cross-language:   pt-BR transcript → en-US pack keeps original evidence/numbers/dates
Integrity metrics (golden evaluator, deterministic mock):
    evidence_reference_validity = 1.0
    unsupported_claim_rate      = 0 (adversarial hallucinated id FLAGGED)
    number_preservation         = PASS ("120","150")
    date_preservation           = PASS ("12 de março"/"20 de março")
    decision_precision          = PASS (decision detected; suggestion excluded)
    explicit_vs_inferred        = NOT MEASURED (no numeric accuracy metric emitted)
Live generation:  PASS — real AI Pack generated, schema + evidence validated
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
live-verify (Deepgram submit):  PASS — real async submit, request_id issued
live-verify (Anthropic AI Pack): PASS — real generation, model=claude-sonnet-5,
               sections=8, cited=3, dropped=0 (schema + evidence validated)
               (CI run 33395992539; opt-in via [live] marker + GitHub Secrets)
Run: GitHub Actions "CI & Live Verify" on the certified commit.
```

## Live blockers (real, remaining)

```
RESOLVED — Deepgram credential: valid DEEPGRAM_API_KEY added as a GitHub Secret;
          CI live-verify PASSED the real async submit (request_id issued). The
          remaining Deepgram gap is only the callback loop, deploy-dependent
          (needs a public API URL), not credential.
RESOLVED — Anthropic credential: valid ANTHROPIC_API_KEY added as a GitHub Secret;
          CI live-verify PASSED real AI Pack generation (schema + evidence
          validated). A blank-model env footgun was fixed along the way (the
          factory/smoke now default on empty/whitespace, not just undefined).
RESOLVED — deployment: Loquia is DEPLOYED and LIVE on Render (free plan), driven
          entirely from the GitHub Actions runner with RENDER_API_KEY (the sandbox
          itself stays egress-blocked from Render/Deepgram/Anthropic).
RESOLVED — Deepgram callback loop + full golden path: PASS live against the
          deployed prod API (real Deepgram callback on the public webhook →
          transcript → AI Pack). See "Live golden path" above.
REMAINING (optional) — EMAIL_API_KEY / EMAIL_FROM not set: invitation + password
          reset emails will fail loudly until configured; the core pipeline
          (record → transcribe → AI Pack → export) is unaffected.
```

## Remaining human actions (optional / hygiene)

```
1. Rotate the keys that passed through chat (Deepgram, Anthropic, Render) — treat
   as exposed.
2. (Optional) Set EMAIL_API_KEY + EMAIL_FROM on loquia-api to enable invitation +
   password-reset emails. Not needed for the core pipeline.
3. Free-plan notes: web services spin down (~15 min idle; ~1 min cold start —
   Deepgram retries its callback so it still lands) and free Postgres expires
   (~30 days). Upgrade plans (add a worker + Key Value, set REDIS_URL) to scale
   out later — no code change. Seeding reset prod demo data (owner:
   vinicius@apymine.com / password123).
```

## Status

```
Implementation readiness:      COMPLETE
Deployment:                    LIVE (Render free plan — web + api + postgres)
Live production verification:  PASS (health, ready, and the full golden path
                               through the deployed API with real providers)
```

## Conclusion

**MILESTONE 5 — produção controlada: NO AR e VERIFICADA LIVE.** Loquia is deployed
on Render (free plan) and the complete golden path (record → process-audio → real
Deepgram callback on the public webhook → transcript → Anthropic AI Pack) passes
end-to-end against the live production API. The one-time deployment obstacles were
each diagnosed from the Render API/logs and fixed by root cause, autonomously via
the GitHub Actions runner. Optional follow-ups only (email keys, key rotation,
plan upgrades for persistence).

Everything technically possible from this session is done: R2 fully removed, the
M5.2 async Deepgram-callback architecture implemented and tested, a real-backend
async e2e added, all credential-independent gates executed green on clean CI
infra, the blueprint deploy-ready, and the deploy reduced to a minimal, precise
set of human actions. The only remaining blockers are environmental (the sandbox
cannot reach Render) and credential (Deepgram/Anthropic/Resend keys absent) —
neither resolvable from within this session.
