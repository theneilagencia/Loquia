# Loquia — Object Storage (Milestone 3)

Media is stored in **Cloudflare R2** (S3-compatible) in production, behind the
`ObjectStorageProvider` interface (`packages/pipeline/src/storage.ts`). The
domain and routes never import an S3 SDK directly.

## Interface

```ts
interface ObjectStorageProvider {
  readonly name: string;
  createUploadUrl(input): Promise<PresignedUpload>;   // short-lived PUT
  createDownloadUrl(input): Promise<PresignedDownload>; // short-lived GET
  headObject(objectKey): Promise<ObjectStat>;          // exists / size / type
  getObject(objectKey): Promise<Uint8Array>;
  deleteObject(objectKey): Promise<void>;
}
```

## Adapters

- **`R2StorageAdapter`** — `@aws-sdk/client-s3` + `s3-request-presigner` against
  the R2 endpoint (`https://<account>.r2.cloudflarestorage.com`). Presigns
  `PUT`/`GET`; the bucket is **private**.
- **`MockStorageAdapter`** — filesystem-backed (under `MEDIA_MOCK_DIR`). Its
  presigned URL points at the API's `/api/_mock-storage` route, so the full
  intent → PUT → HEAD → GET → delete flow works with no external dependency.
  Used for dev, tests, and the provider-mocked e2e.

## Selection (no silent prod fallback)

`createStorageProvider(env, mock)`:

- `STORAGE_PROVIDER=r2` → requires `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` (throws if any is missing).
- `STORAGE_PROVIDER=mock` → mock (allowed in any env, but must be **explicit** in
  production).
- unset → `r2` if `R2_ACCOUNT_ID` is present, else `mock` in dev; in production
  an unset/implicit provider **throws** rather than degrade to mock.

## Object keys (server-side only)

Keys are always generated server-side — a browser-provided path is never trusted:

```
workspace/<workspaceId>/meetings/<meetingId>/<mediaAssetId>/<safeFilename>
```

`sanitizeFilename` strips any path, normalizes Unicode, removes unsafe
characters, and forces a sane extension from the MIME type. `validateUpload`
rejects non-accepted MIME types, empty files, and files over
`MAX_UPLOAD_SIZE_BYTES` (default 500 MB). Accepted types: MP3, M4A/MP4, WAV,
WebM, OGG (audio) and MP4/WebM (video container).

## Security

- Private bucket; access only through **short-lived presigned URLs**
  (`MEDIA_UPLOAD_URL_TTL_SECONDS` = 900 s, `MEDIA_DOWNLOAD_URL_TTL_SECONDS`
  = 3600 s).
- The API **never proxies** the media bytes — the browser uploads directly to
  storage, and the worker downloads directly via a presigned URL.
- No R2 credentials ever reach the browser or the logs.

## Live smoke

A real R2 round-trip (create bucket URL → PUT → HEAD → GET → delete) is only run
when R2 credentials are configured. Without them it is reported **`NOT RUN —
credentials unavailable`**.

## Local First (Milestone 5 REVISADA)

`ObjectStorageProvider` is now a **temporary processing buffer**, not the audio
archive. The primary recording lives on the device in `LocalMediaStore`
(`apps/web/src/lib/local-media/`, OPFS → IndexedDB → memory). New remote assets
are `discard_after_processing` and are deleted once the transcript persists
(storage-first, retryable), with a `REMOTE_MEDIA_MAX_TTL_HOURS` lifecycle
backstop (mirror it in the R2 bucket lifecycle rule). The smoke exercises the
full temporary-processing lifecycle: presign PUT → HEAD (present) → DELETE →
HEAD (absent). See `docs/local-first-media.md`.
