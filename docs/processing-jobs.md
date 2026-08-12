# Loquia — Processing Jobs & Queue (Milestone 3)

A `ProcessingJob` tracks one media→transcript run. The API enqueues it; the
worker (`apps/worker`) consumes it. Processing is **idempotent** and retries are
**safe** (no duplicate segments).

## Queue

- **BullMQ** over Redis (`REDIS_URL`; Render Key Value in production).
- Queue name: `meeting-processing` (`MEETING_QUEUE`).
- Payload is minimal — `{ processingJobId }`. The worker loads everything else
  from Postgres, so the queue never carries meeting content.
- Producer options: `jobId = processingJobId` (dedupes duplicate enqueues),
  `attempts: 3`, exponential backoff (2 s base), `removeOnComplete/Fail` caps.
- Dev without Redis: `enqueue` is a no-op (the queue is simply disabled).

## Job lifecycle

```
queued → running → completed
                 ↘ failed        (permanent error)
                 ↘ queued        (retryable error → BullMQ re-runs, ≤ attempts)
```

Stages (persisted on the job for the UI): `received → preparing_audio →
transcribing → identifying_speakers → organizing_topics → ready_for_ai_pack`.
The terminal stage is `ready_for_ai_pack` — the pipeline never claims an AI Pack
was generated.

## Idempotency & claim

`processJob(deps, processingJobId)`:

1. **Skip** if the job is missing or already `completed` (re-delivery is a no-op).
2. **Claim** via a conditional `UPDATE … WHERE status <> 'completed'` → `running`.
   If no row is claimed, another worker/attempt owns it → skip.
3. Load the `MediaAsset` + meeting, presign a download URL, transcribe, segment.
4. **Transactional replacement**: within one transaction, *delete* any existing
   `TranscriptSegment`s for the meeting, then insert the fresh set, set the
   meeting to `ready` (reset `speakerAliases`), mark the asset `ready`, and mark
   the job `completed` with provider metrics. Reprocessing therefore **replaces**
   rather than duplicates segments.

## Retry classification

`PipelineError` carries a `category`; the worker maps it to transient vs
permanent (`isRetryable`):

| Retryable (→ re-queued)                              | Permanent (→ failed)                                          |
| --------------------------------------------------- | ------------------------------------------------------------ |
| `network`, `provider_timeout`, `provider_5xx`, `storage_access` | `unsupported_media`, `invalid_audio`, `authorization`, `provider_rejected`, `unknown` |

On a permanent failure the meeting is set to `failed` and the asset to `failed`;
what was captured is preserved and the user can retry. The detailed technical
error (`errorCode`, `errorMessage`) is stored for audit but **never surfaced
verbatim** to the UI. BullMQ decides re-run vs give-up from the `attempts` config.

## Metrics

On completion the job stores `metrics` = `{ segmentCount, wordCount,
speakerCount, providerDurationMs }` plus `provider`, `providerRequestId`, and
`model`.

## Logging

The worker emits structured JSON logs (`service: loquia-worker`) keyed by
**IDs only** — `processingJobId`, `meetingId`, `workspaceId`, provider request
id, counts — never transcript text or media content.

## Tests

- `apps/worker` — `process-job.test.ts` (idempotency, retryable vs permanent,
  segment replacement) against a real Postgres; `queue.test.ts` against a real
  BullMQ/Redis.
- `apps/web/e2e-api/media-pipeline.spec.ts` — provider-mocked browser e2e:
  upload → queue → worker → transcript segments → frontend.
