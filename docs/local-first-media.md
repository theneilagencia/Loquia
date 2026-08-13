# Local First Media (Milestone 5 REVISADA)

## Canonical decision

> **Local recording is the primary copy. Remote object storage is temporary
> processing infrastructure by default.**

The original recording stays on the user's device. Cloudflare R2 (or any
`ObjectStorageProvider`) is only a **temporary processing buffer**: a copy is
sent for transcription and **deleted after the transcript is persisted**. The
product keeps working after the remote copy is gone.

```
Gravar
→ salvar áudio localmente        (LocalMediaStore: OPFS → IndexedDB)
→ usuário encerra reunião
→ enviar cópia temporária          (presigned PUT → R2)
→ STT                              (Deepgram)
→ persistir transcript             (Postgres)
→ apagar mídia temporária remota   (delete_processing_media job)
→ manter áudio original localmente
```

## Two distinct responsibilities

| Concern                | Owner                    | Lifetime                         |
| ---------------------- | ------------------------ | -------------------------------- |
| Original recording     | `LocalMediaStore` (device) | Until the user removes it        |
| Temporary processing copy | `ObjectStorageProvider` (R2) | Until the transcript persists (then deleted) |
| Transcript / AI Pack   | Postgres (server)        | Persisted (unchanged from M3/M4) |

`LocalMediaStore` and `ObjectStorageProvider` are **separate** abstractions —
object storage is no longer the source of the audio. We did NOT rename
`ObjectStorageProvider`/`MediaAsset` destructively (§21/§56); instead the remote
`media_assets` row is documented as a temporary *RemoteProcessingAsset*.

## On-device store (`apps/web/src/lib/local-media/`)

- **Backends** (`backends.ts`): `OpfsBlobBackend` (preferred) → `IndexedDbBlobBackend`
  (fallback) → `MemoryBlobBackend` (SSR/tests), one async contract. Quota errors
  are normalized to `LocalMediaQuotaError`.
- **Capabilities** (`capabilities.ts`): detect OPFS / IndexedDB / persistence API,
  request persistence (best-effort — never an absolute guarantee), read
  quota/usage via `storage.estimate()`. Never throws.
- **Store** (`store.ts`): `LocalMediaAsset` CRUD (save/get/getBlob/exists/patch/
  delete/getByMeeting), a metadata index in the browser key-value storage, and
  **workspace namespacing** so a different workspace on the same browser cannot
  see another's recordings (§34). The UI only ever talks to this store.
- **Playback** (`playback.ts`): `useLocalAudio` prefers the on-device blob (object
  URL); `downloadFilename` builds `loquia-<slug>-<date>.<ext>`.

## Recorder (`use-recorder.ts`, `adapters/media-recorder.ts`)

Real capture via `MediaRecorder` when a mic is present; a deterministic WAV
fallback for headless/no-mic so the flow works everywhere. `finish()`:

1. finalize the recording → a real `Blob`;
2. create the meeting + a temporary remote intent;
3. **persist on device and confirm it** before any processing upload (§7);
4. PUT the temporary copy to R2 (real presigned PUT);
5. `complete` → enqueue processing.

Failures are honest and never lose the recording: `LocalMediaQuotaError` (§13),
upload-intent failure, and processing-upload failure each surface a message and
keep the on-device blob. Processing can be retried from the local copy via
`POST /api/meetings/:id/reprocess` (§38/§39) — no re-recording.

## Remote temporary lifecycle (backend)

See `docs/media-pipeline.md`. In short: the transcription worker, **after** the
transcript commits, marks the remote copy `deletion_pending` and enqueues a
`delete_processing_media` job that deletes the object storage-first and marks the
asset `deleted`. A storage failure marks it `delete_failed` and retries (BullMQ +
the cleanup cron + a `REMOTE_MEDIA_MAX_TTL_HOURS` backstop). The transcript and
AI Pack are never blocked or reprocessed by cleanup (§23–§27).

## Second device

Because audio is local-first, opening the same meeting on another device shows
the transcript, AI Pack and metadata, but the audio may be unavailable — an
honest "stored on another device" state, not a backend error (§18/§45).

## What we deliberately did NOT do

No cross-device audio sync (§46) — backups are the user's "save a copy to your
computer" action. No custom client-side crypto (§35). No permanent remote
retention options (§28).
