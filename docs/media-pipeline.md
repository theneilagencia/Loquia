# Loquia — Media Pipeline (Milestone 3)

Milestone 3 turns a recording or uploaded file into a persisted, diarized
transcript through a **real** asynchronous pipeline:

```
Record / upload
   → direct browser upload to Object Storage (API never proxies the bytes)
   → MediaAsset (server-side object key, private bucket)
   → ProcessingJob (queued)
   → BullMQ queue (Redis / Render Key Value)
   → Worker (apps/worker)
       → download (short-lived presigned URL)
       → Speech-to-Text (Deepgram Nova + diarization)
       → segmentation (group words → readable segments, speaker-aware)
       → TranscriptSegment[] persisted (source of truth, stable ids)
   → frontend shows the transcript + honest "AI Pack not processed yet"
```

**No AI Pack / LLM generation happens in this milestone.** Once the transcript
is ready, the meeting detail page states, honestly, *"Transcrição concluída. AI
Pack ainda não processado."* — it never fabricates a pack.

## Provider abstraction

The domain never talks to R2 or Deepgram directly. Two interfaces
(`packages/pipeline`) decouple it:

- `ObjectStorageProvider` — presigned upload/download, HEAD, delete.
- `TranscriptionProvider` — `transcribe()` returning diarized words.

Each has a real adapter (`R2StorageAdapter`, `DeepgramTranscriptionAdapter`) and
a deterministic mock (`MockStorageAdapter`, `MockTranscriptionAdapter`). Adapters
are selected by env through `createStorageProvider` / `createTranscriptionProvider`
(see `docs/storage.md`, `docs/transcription-provider.md`). **Production never
silently falls back to a mock** — a missing credential throws at boot.

| Concern           | Env                                          | Prod default |
| ----------------- | -------------------------------------------- | ------------ |
| Object storage    | `STORAGE_PROVIDER=r2\|mock`                   | `r2`         |
| Transcription     | `TRANSCRIPTION_PROVIDER=deepgram\|mock`      | `deepgram`   |
| Queue backend     | `REDIS_URL`                                  | Render KV    |

## Direct-upload flow (API never proxies media)

1. `POST /api/meetings/upload-intent` — creates the meeting + a `pending_upload`
   `MediaAsset` with a **server-generated object key**, returns a short-lived
   presigned `PUT` URL (`MEDIA_UPLOAD_URL_TTL_SECONDS`, default 15 min).
2. Browser `PUT`s the file **straight to storage** using that URL. R2/Deepgram
   secrets never reach the browser.
3. `POST /api/media/:id/complete` — HEADs the object (verifies it exists and is
   non-empty / within `MAX_UPLOAD_SIZE_BYTES`), flips the asset to `uploaded`,
   creates a `queued` `ProcessingJob`, and enqueues it on BullMQ.
4. `GET /api/meetings/:id/audio-url` — a short-lived presigned download URL for
   playback (`MEDIA_DOWNLOAD_URL_TTL_SECONDS`, default 1 h). The bucket stays
   private.

The mock storage adapter emulates the same shape: the presigned URL points at
`/api/_mock-storage`, a filesystem-backed route only registered when the mock
provider is active, so the whole intent → PUT → HEAD → GET flow runs end to end
without R2. **The frontend upload code is identical in mock and API modes** — it
`PUT`s to `uploadUrl` when present and calls `complete` regardless.

## Worker & idempotency

`apps/worker` is a BullMQ `Worker` consuming the `meeting-processing` queue. See
`docs/processing-jobs.md` for the job lifecycle, claim protocol, retry
classification (transient vs permanent), and the transactional segment
replacement that guarantees **no duplicate segments** on re-delivery or retry.

## Diarization → neutral domain

Provider speaker indices are mapped to neutral, technical labels
(`Speaker 1`, `Speaker 2`, …) with stable per-meeting keys (`sp1`, `sp2`). Users
can rename speakers (`speakerAliases`); renaming never mutates the stable key, so
future `EvidenceReference`s stay valid. Fresh diarization on reprocess resets
aliases back to the technical labels.

## Segmentation

`segmentTranscription` groups words into readable segments (never one-per-word).
It is deterministic and unit-tested. A new segment starts when:

- the **speaker changes**, or
- the **gap** between words exceeds `maxGapMs` (default 1200 ms), or
- the segment grows past `maxSegmentMs` (15 s) **or** `maxWords` (60) *and* the
  previous word ends a sentence (split at a sentence boundary).

Each `TranscriptSegment` carries `startMs`/`endMs`, `sequence`, average
`confidence`, and a stable id — it is the **source of truth** for the transcript.

## FFmpeg normalization (deferred)

Audio normalization/transcoding is an optional pre-STT step. It is **not** run in
this milestone (FFmpeg is not provisioned in this environment); Deepgram accepts
the accepted MIME types directly. The seam exists in the worker (`preparing_audio`
stage) for a future milestone.

## Live smoke checks

Real R2 and Deepgram smokes require credentials. When
`R2_*` / `DEEPGRAM_API_KEY` are absent they are reported **`NOT RUN —
credentials unavailable`**, never falsely marked PASS. The full pipeline is
exercised in CI with the mock providers (unit + integration + a real-BullMQ
worker test + a provider-mocked browser e2e).

## Local First remote lifecycle (Milestone 5 REVISADA)

The remote copy is temporary. After the transcription worker commits the
transcript, it marks the remote `media_assets` row `deletion_pending` and
enqueues a `delete_processing_media` job. That job deletes the object
storage-first and marks the asset `deleted`; a storage failure marks it
`delete_failed` and requeues (BullMQ retry). The cleanup cron and a
`REMOTE_MEDIA_MAX_TTL_HOURS` expiry are the backstops. Cleanup NEVER blocks or
reprocesses transcription — the transcript and AI Pack are already persisted and
are never touched. Media-asset statuses: `pending_upload → uploaded → processing
→ deletion_pending → deleted` (or `delete_failed` → retry). `ready` is legacy.
See `docs/local-first-media.md`.
