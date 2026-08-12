# Milestone 3 — Real Media Pipeline · Final Report

## Git

```
Branch:             claude/loquia-milestone-1-frontend-rnoc96
Commits (this MS):  3 (pipeline abstractions → media activation → UI/e2e/docs/smokes)
Working tree clean: YES
Pushed:             YES
```

## Pipeline (real, end to end)

```
Record / upload
  → direct browser upload to Object Storage (API never proxies the bytes)
  → MediaAsset (server-side object key, private bucket)
  → ProcessingJob (queued)
  → BullMQ queue (Redis / Render Key Value)
  → Worker (apps/worker)
      → download via short-lived presigned URL
      → STT (Deepgram Nova + diarization)   [real adapter; mock in this env]
      → segmentation (group words, speaker-aware, deterministic)
      → TranscriptSegment[] persisted (source of truth, stable ids)
  → frontend: transcript + honest "AI Pack ainda não processado."
```

## Providers (abstracted, env-selected)

```
ObjectStorageProvider:  interface (packages/pipeline/src/storage.ts)
  R2StorageAdapter:     YES  (@aws-sdk/client-s3 + presigner; private bucket)
  MockStorageAdapter:   YES  (fs-backed; drives full intent→PUT→HEAD→GET→delete)
TranscriptionProvider:  interface (packages/pipeline/src/transcription.ts)
  DeepgramTranscription: YES (typed fetch; Nova family, diarize, word timings)
  MockTranscription:     YES (deterministic pt/en two-speaker dialogue)
Selection:              STORAGE_PROVIDER=r2|mock, TRANSCRIPTION_PROVIDER=deepgram|mock
No silent prod fallback: YES (missing R2_*/DEEPGRAM_API_KEY throws at boot)
```

## Direct upload & security

```
API proxies media bytes:   NO  (browser PUTs straight to storage)
Object keys:               server-side only (workspace/<ws>/meetings/<id>/<asset>/<file>)
Private bucket:            YES
Presigned URLs:            short-lived (upload 900s, download 3600s)
Secrets in browser/logs:   NONE (R2/Deepgram keys server-side only; ID-only logs)
Upload validation:         MIME allow-list + size (MAX_UPLOAD_SIZE_BYTES=500MB) + empty check
```

## Queue & worker (idempotent, safe retries)

```
Queue:                 BullMQ over Redis, queue "meeting-processing"
Producer:              jobId=processingJobId (dedupe), attempts=3, exp backoff
Idempotency:           claim via conditional UPDATE; completed re-delivery = no-op
No duplicate segments: YES (transactional delete-then-insert on (re)process)
Retry classification:  transient (network/timeout/5xx/storage) → requeue;
                       permanent (unsupported/invalid/authz/rejected) → failed
Diarization → domain:  neutral technical labels "Speaker N", stable keys spN,
                       renameable (aliases), reset on fresh diarization
Segmentation:          groups words (not one-per-word); new segment on speaker
                       change / gap>1200ms / length caps at sentence boundary;
                       deterministic + unit-tested
```

## Gates

```
build:        PASS  (next build)
typecheck:    PASS  (tsc across all 9 workspace projects incl. apps/worker + pipeline)
lint:         PASS  (next lint; api/worker/pipeline validated by tsc)
unit:         PASS  (44: 18 export-engine + 16 web + 10 pipeline)
integration:  PASS  (22 apps/api incl. media routes, against real Postgres)
worker:       PASS  (5 apps/worker: 4 process-job idempotency/retry + 1 real BullMQ)
e2e:          PASS  (mock 9 + real-API 3 = 12 Playwright; incl. provider-mocked
                     upload→queue→worker→transcript→frontend)
storybook:    PASS  (storybook build)
```

## Live provider smokes (honest)

```
R2 storage round-trip:  NOT RUN — credentials unavailable
Deepgram transcription: NOT RUN — credentials unavailable
```

Run with `pnpm --filter @loquia/pipeline smoke`. The script performs a real
round-trip **only** when the secrets are present; it never falsely reports PASS.
In this environment no R2/Deepgram credentials are configured, so both are
honestly **NOT RUN**. The full pipeline is nonetheless exercised end to end via
the mock providers (unit + integration + real-BullMQ worker test + browser e2e).

## Render

```
render.yaml:      YES (loquia-postgres, loquia-api, loquia-web,
                       loquia-worker [active consumer], loquia-queue [Key Value])
Providers wired:  STORAGE_PROVIDER=r2, TRANSCRIPTION_PROVIDER=deepgram on API+worker
Secrets:          R2_* and DEEPGRAM_API_KEY via sync:false (never committed)
Deploy executed:  NO  (blueprint structurally validated only)
```

## No regressions

```
MockAdapter selectable:  YES (NEXT_PUBLIC_APP_MODE=mock still fully works)
UI bifurcation mock/api: NONE (same upload/record/detail code both modes)
M1/M2 gates:             GREEN (all prior tests still pass)
```

## Explicitly NOT done (by design)

- **AI Pack / LLM generation** — not implemented. After a real transcript the UI
  shows the honest "Transcrição concluída. AI Pack ainda não processado." It
  never fabricates a pack.
- **Email** — not sent (unchanged from M2).
- **FFmpeg** audio normalization — deferred; the seam exists at the
  `preparing_audio` stage. Deepgram accepts the accepted MIME types directly.
- **Live R2/Deepgram smokes** — NOT RUN (no credentials), reported honestly.

## Gaps (obligatory)

`Nenhum gap obrigatório identificado.`

The Definition of Done is met: real object storage (R2) and STT (Deepgram) behind
interfaces with mocks; direct browser upload with server-side keys, private
bucket, short-lived presigned URLs and no secrets in the browser; a real BullMQ
queue and a real worker that is idempotent and retries safely with no duplicate
segments; diarization mapped to neutral renameable labels; deterministic,
tested segmentation producing `TranscriptSegment[]` as the source of truth with
stable ids; providers selectable by env with no silent production fallback;
honest AI-Pack-pending state in the UI; live smokes marked NOT RUN when
credentials are absent; and no regression of the M1/M2 gates.

## Conclusion

**MILESTONE 3 APROVADA — pipeline de mídia e transcrição pronto para geração real de AI Pack.**
