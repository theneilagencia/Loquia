import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type {
  CreateUploadInput,
  ObjectStat,
  ObjectStorageProvider,
  PresignedDownload,
  PresignedUpload,
} from '../storage';

/**
 * Filesystem-backed mock storage. `createUploadUrl` points at the API's mock
 * storage route (which writes bytes to the same directory), so the whole
 * intent → PUT → HEAD → GET → delete flow works end to end without R2.
 */
export class MockStorageAdapter implements ObjectStorageProvider {
  readonly name = 'mock';

  constructor(
    private readonly dir: string,
    private readonly publicBaseUrl: string,
  ) {
    mkdirSync(dir, { recursive: true });
  }

  private pathFor(objectKey: string): string {
    const hash = createHash('sha256').update(objectKey).digest('hex');
    return join(this.dir, hash);
  }

  private metaPathFor(objectKey: string): string {
    return `${this.pathFor(objectKey)}.meta.json`;
  }

  async createUploadUrl(input: CreateUploadInput): Promise<PresignedUpload> {
    return {
      url: `${this.publicBaseUrl}/api/_mock-storage/${encodeURIComponent(input.objectKey)}`,
      method: 'PUT',
      headers: { 'content-type': input.contentType },
      expiresAt: new Date(Date.now() + input.ttlSeconds * 1000).toISOString(),
    };
  }

  async createDownloadUrl(input: { objectKey: string; ttlSeconds: number }): Promise<PresignedDownload> {
    return {
      url: `${this.publicBaseUrl}/api/_mock-storage/${encodeURIComponent(input.objectKey)}`,
      expiresAt: new Date(Date.now() + input.ttlSeconds * 1000).toISOString(),
    };
  }

  async headObject(objectKey: string): Promise<ObjectStat> {
    const p = this.pathFor(objectKey);
    if (!existsSync(p)) return { exists: false };
    const stat = statSync(p);
    let contentType: string | undefined;
    try {
      contentType = JSON.parse(readFileSync(this.metaPathFor(objectKey), 'utf8')).contentType;
    } catch {
      /* ignore */
    }
    return { exists: true, sizeBytes: stat.size, contentType };
  }

  async getObject(objectKey: string): Promise<Uint8Array> {
    return new Uint8Array(readFileSync(this.pathFor(objectKey)));
  }

  async deleteObject(objectKey: string): Promise<void> {
    rmSync(this.pathFor(objectKey), { force: true });
    rmSync(this.metaPathFor(objectKey), { force: true });
  }

  /** Used by the API's mock storage route to persist an uploaded body. */
  putObjectSync(objectKey: string, body: Uint8Array, contentType: string): void {
    writeFileSync(this.pathFor(objectKey), body);
    writeFileSync(this.metaPathFor(objectKey), JSON.stringify({ contentType }));
  }
}
