# Media Retention & Cleanup

Retention governs **audio/media only**. Transcripts and AI Packs are never
deleted by retention — the meeting stays fully usable after its audio is gone.

## Policies

`RetentionPolicy = 'keep' | '7d' | '30d' | '90d' | 'discard_after_processing'`.

`computeRetention(env, storeAudio, uploadedAt)` (in
`apps/api/src/services/retention.ts`) decides the policy when an upload completes:

- `storeAudio === false` → `discard_after_processing`, `expiresAt = null` (the
  audio is deleted as soon as processing produced the transcript).
- otherwise → from `MEDIA_RETENTION_DAYS`:
  - `0` → `keep` (never auto-delete), `expiresAt = null`.
  - `N > 0` → `policyForDays(N)` with `expiresAt = uploadedAt + N days`.

`storeAudio` comes from the meeting **owner's** privacy setting
(`ownerStoreAudio` → `userSettings.privacy.storeAudioAfterProcessing`, default
`true`). The chosen `retentionPolicy` + `expiresAt` are persisted on the
`media_assets` row at `POST /api/media/:id/complete`.

## Cleanup job

`runMediaCleanup({ db, storage, log })` deletes eligible media:

- **Eligible** = not already `deleted`, and either `expiresAt <= now`, or
  `retentionPolicy = discard_after_processing` while still `ready`.
- **Order matters**: delete the storage object **first**, then mark the asset
  `deleted` and write a `media_deleted` audit event (`actor = system/retention`).
- **Storage failure is safe**: if the storage delete throws, the asset row is
  left intact and a `cleanup_failed` event is logged; the next run retries. No
  row is ever marked deleted while its object may still exist.

`countEligibleForCleanup(db)` reports how many assets are due (used by the smoke
/ observability).

## Entry point & schedule

`apps/api/src/cleanup.ts` (`pnpm --filter @loquia/api cleanup`) loads env, opens a
small DB pool + the configured storage provider, runs `runMediaCleanup`, emits
structured JSON logs (`service: loquia-cleanup`, `cleanup_completed`), and exits
`1` if any asset failed to delete (so the scheduler surfaces partial failures).

In production it runs as the `loquia-cleanup` Render cronjob, hourly
(`0 * * * *`), with the DB + the **same** R2 credentials as the API/worker.

## Manual delete

Deleting a meeting (`DELETE /api/meetings/:id`) also removes its media
storage-first, then all rows; a storage failure returns `502 storage_error` and
keeps the rows for retry. See `docs/incident-basics.md`.
