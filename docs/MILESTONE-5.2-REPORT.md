# Milestone 5.2 — Remove R2, Direct Temporary Audio Processing · Final Report

> Canonical: **object storage is removed from the MVP.** The original audio is
> Local First on the device; processing uses temporary media received directly by
> Loquia's infrastructure. No feature depends on R2; no R2 credentials are needed.

## Git

```
Branch:  claude/loquia-milestone-1-frontend-rnoc96
Commits (this MS): 4 (backend removal+ingest → frontend → config/docs → report)
Pushed:  YES (branch)
```

## Architecture

```
R2 required:              NO  (removed entirely)
LocalMediaStore:          UNCHANGED (OPFS → IndexedDB → memory; primary copy)
Direct processing upload: POST /api/meetings/process-audio (raw body, streaming)
Temporary server media:   per-instance temp file, deleted after transcription
Deepgram adapter:         raw audio bytes (no URL); provider abstraction preserved
Worker required:          YES — for AI Pack only (storage-independent, async)
Queue required:           YES — BullMQ backs the AI Pack jobs
```

Decision (see `docs/decisions.md` §33-36): the API and worker are **separate
Render instances** (no shared disk), and Deepgram accepts raw bytes — so the API
ingests the audio and transcribes it **in-process, detached** (returns 202 fast),
persists the transcript, and enqueues the AI Pack. The worker no longer
transcribes.

## Removed (because of the R2 removal)

```
env vars:   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME,
            STORAGE_PROVIDER, MEDIA_MOCK_DIR, MEDIA_UPLOAD_URL_TTL_SECONDS,
            MEDIA_DOWNLOAD_URL_TTL_SECONDS, REMOTE_MEDIA_MAX_TTL_HOURS
packages:   @aws-sdk/client-s3, @aws-sdk/s3-request-presigner
adapters:   R2StorageAdapter, MockStorageAdapter, ObjectStorageProvider, object-key
routes:     upload-intent, /media/:id/complete, /:id/reprocess, /:id/audio-url,
            /_mock-storage
jobs:       worker transcription branch, delete_processing_media job, cleanup cron
services:   retention service + apps/api/src/cleanup.ts
config:     loquia-cleanup Render cronjob; all R2 env on api/worker
docs:       R2 storage smoke; R2 sections updated across docs
```

`MediaAsset` is deprecated (no longer written); `ProcessingJob` is the processing
attempt record. The table is left in place (non-destructive).

## Retry

```
STT transient retry:   in-task timeout + classification; then needs_reupload
Needs local reupload:  media discarded after each attempt → re-send local copy
Reprocess from local:  POST /api/meetings/:id/process-audio (recorder + panel)
Local audio preserved: YES — the on-device recording is never discarded on failure
```

## Privacy

```
Local recording primary:        YES
Remote permanent audio storage:  NONE (no object storage at all)
Privacy copy accurate:           YES — "sent temporarily for transcription, not
                                 kept as a permanent recording"; no "deleted
                                 immediately"/"never stored" claims
Second-device behavior:          UNCHANGED (honest "stored on another device")
```

## Gates (no external credentials)

```
build:            PASS  (next build)
typecheck:        PASS  (tsc across all workspaces)
lint:             PASS  (next lint)
unit:             PASS  (web 30 · pipeline 21 · export-engine 18)
integration:      PASS  (api 31 incl. direct-ingest tests)
worker:           PASS  (6 — AI-Pack-only)
e2e:              PASS  (11 incl. local persistence + second-device)
storybook:        PASS
production smoke: DB/queue/temp-media PASS · providers NOT RUN
secret scan:      CLEAN (no keys/tokens in tracked files)
```

## Live blockers (real only)

```
Render deploy:  NOT RUN — not performed
Deepgram:       NOT RUN — credentials unavailable
Anthropic:      NOT RUN — credentials unavailable
Resend:         NOT RUN — credentials unavailable
```

R2 is **no longer a blocker.** The remaining blockers are the live provider
credentials + the Render deploy.

```
Implementation readiness: COMPLETE
Live production verification: BLOCKED ON CREDENTIALS
```

## Conclusion

**MILESTONE 5 REPROVADA — produção controlada ainda possui blockers.**

The R2 removal and direct-processing refactor are complete, tested, and
committed; every credential-independent gate is green. The only remaining
blockers are the live Deepgram / Anthropic / Resend credentials and the Render
deploy. To flip to APROVADA, provide those credentials, deploy the Blueprint, run
the live smokes, and execute one real golden path (login → record → local persist
→ process-audio → Deepgram → transcript → Anthropic → AI Pack → evidence → local
playback → export).
