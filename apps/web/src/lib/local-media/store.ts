/**
 * LocalMediaStore (Milestone 5 REVISADA §4/§5/§34). The on-device home of the
 * primary recording. Composes a blob backend (OPFS/IndexedDB/memory) with a small
 * metadata index persisted in the browser's key-value storage. Namespaced by
 * workspace so a different workspace signed in on the same browser can't see
 * another's recordings. The UI never touches OPFS/IndexedDB directly — it goes
 * through this store.
 */
import type { BrowserStorageAdapter } from '@loquia/contracts';
import { type BlobBackend, type LocalMediaAsset, type LocalMediaStatus, type SaveLocalMediaInput, LocalMediaQuotaError } from './types';

function newId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `lm_${Math.abs(Date.now() ^ Math.floor(Math.random() * 1e9)).toString(36)}`;
}

export class LocalMediaStore {
  private readonly indexKey: string;

  constructor(
    private readonly backend: BlobBackend,
    private readonly meta: BrowserStorageAdapter,
    /** Namespace — the current workspace id (§34 multi-user isolation). */
    private readonly namespace: string,
  ) {
    this.indexKey = `localmedia:${namespace}`;
  }

  get backendKind(): BlobBackend['kind'] {
    return this.backend.kind;
  }

  private index(): Record<string, LocalMediaAsset> {
    return this.meta.get<Record<string, LocalMediaAsset>>(this.indexKey) ?? {};
  }
  private writeIndex(idx: Record<string, LocalMediaAsset>): void {
    this.meta.set(this.indexKey, idx);
  }
  private blobKey(asset: Pick<LocalMediaAsset, 'id' | 'meetingId'>): string {
    return `${this.namespace}/${asset.meetingId}/${asset.id}`;
  }

  /** Persist a recording to the device. Throws LocalMediaQuotaError when full (§13). */
  async save(input: SaveLocalMediaInput): Promise<LocalMediaAsset> {
    const now = new Date().toISOString();
    const asset: LocalMediaAsset = {
      id: newId(),
      meetingId: input.meetingId,
      storageType: this.backend.kind,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.blob.size,
      durationMs: input.durationMs,
      status: 'available',
      processingUploadStatus: 'idle',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await this.backend.put(this.blobKey(asset), input.blob);
    } catch (err) {
      if (err instanceof LocalMediaQuotaError) throw err;
      throw err;
    }
    const idx = this.index();
    idx[asset.id] = asset;
    this.writeIndex(idx);
    return asset;
  }

  get(id: string): LocalMediaAsset | null {
    return this.index()[id] ?? null;
  }

  /** The most recent local asset for a meeting, if any. */
  getByMeeting(meetingId: string): LocalMediaAsset | null {
    const all = Object.values(this.index()).filter((a) => a.meetingId === meetingId);
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all[0] ?? null;
  }

  list(): LocalMediaAsset[] {
    return Object.values(this.index());
  }

  async getBlob(id: string): Promise<Blob | null> {
    const asset = this.get(id);
    if (!asset) return null;
    return this.backend.get(this.blobKey(asset));
  }

  /** Whether the blob actually exists on the device right now (metadata may be stale). */
  async exists(id: string): Promise<boolean> {
    const asset = this.get(id);
    if (!asset) return false;
    return this.backend.exists(this.blobKey(asset));
  }

  async patch(id: string, patch: Partial<Pick<LocalMediaAsset, 'status' | 'processingUploadStatus' | 'remoteProcessingAssetId' | 'durationMs'>>): Promise<LocalMediaAsset | null> {
    const idx = this.index();
    const asset = idx[id];
    if (!asset) return null;
    idx[id] = { ...asset, ...patch, updatedAt: new Date().toISOString() };
    this.writeIndex(idx);
    return idx[id];
  }

  setStatus(id: string, status: LocalMediaStatus): Promise<LocalMediaAsset | null> {
    return this.patch(id, { status });
  }

  /** Remove the recording from this device (blob + metadata). Meeting data is untouched. */
  async delete(id: string): Promise<void> {
    const asset = this.get(id);
    if (asset) await this.backend.delete(this.blobKey(asset));
    const idx = this.index();
    delete idx[id];
    this.writeIndex(idx);
  }
}
