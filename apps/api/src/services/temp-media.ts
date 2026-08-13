/**
 * Temporary media handling for direct processing (Milestone 5.2). There is NO
 * object storage: the API receives the audio, streams it to a temp file on *this*
 * instance, transcribes it, and deletes it. Because the API and worker run on
 * separate Render instances (no shared disk), all use of a temp file MUST stay in
 * the same process that created it — never handed to another instance (§8/§10).
 */
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform, type Readable } from 'node:stream';

export const TEMP_MEDIA_DIR = join(tmpdir(), 'loquia-ingest');

export class UploadTooLargeError extends Error {
  constructor() {
    super('upload_too_large');
    this.name = 'UploadTooLargeError';
  }
}

/** A counting transform that aborts the stream once maxBytes is exceeded. */
function capBytes(maxBytes: number, onCount: (n: number) => void): Transform {
  let total = 0;
  return new Transform({
    transform(chunk, _enc, cb) {
      total += chunk.length;
      if (total > maxBytes) {
        cb(new UploadTooLargeError());
        return;
      }
      onCount(total);
      cb(null, chunk);
    },
  });
}

/**
 * Stream a request body to a temp file. `id` is server-generated (never
 * user-controlled) so the filename cannot cause path traversal (§48). Returns the
 * absolute path + byte size; the caller MUST remove it when done (see removeTempFile).
 */
export async function streamToTempFile(payload: Readable, id: string, maxBytes: number): Promise<{ path: string; sizeBytes: number }> {
  await mkdir(TEMP_MEDIA_DIR, { recursive: true });
  const path = join(TEMP_MEDIA_DIR, `${id}.bin`);
  let sizeBytes = 0;
  try {
    await pipeline(payload, capBytes(maxBytes, (n) => (sizeBytes = n)), createWriteStream(path));
  } catch (err) {
    await removeTempFile(path);
    throw err;
  }
  return { path, sizeBytes };
}

export async function removeTempFile(path: string): Promise<void> {
  await rm(path, { force: true }).catch(() => undefined);
}

/**
 * Best-effort sweep of stale temp files left by crashed ingests on THIS instance
 * (§23). Never a cross-instance guarantee — only files this instance can see.
 */
export async function sweepStaleTempFiles(maxAgeMs: number, now = Date.now()): Promise<number> {
  let removed = 0;
  let names: string[];
  try {
    names = await readdir(TEMP_MEDIA_DIR);
  } catch {
    return 0; // dir doesn't exist yet
  }
  for (const name of names) {
    const p = join(TEMP_MEDIA_DIR, name);
    try {
      const s = await stat(p);
      if (now - s.mtimeMs > maxAgeMs) {
        await removeTempFile(p);
        removed += 1;
      }
    } catch {
      /* raced with another cleanup */
    }
  }
  return removed;
}
