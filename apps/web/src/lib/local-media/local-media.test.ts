import { describe, expect, it } from 'vitest';
import type { BrowserStorageAdapter } from '@loquia/contracts';
import { availableBytes, detectCapabilities, requestPersistence, type CapabilityGlobals } from './capabilities';
import { MemoryBlobBackend, selectBlobBackend } from './backends';
import { LocalMediaStore } from './store';
import { LocalMediaQuotaError, type BlobBackend } from './types';

/** Tiny in-memory metadata adapter matching the BrowserStorageAdapter contract. */
function memMeta(): BrowserStorageAdapter {
  const m = new Map<string, unknown>();
  return {
    get: <T>(k: string) => (m.has(k) ? (m.get(k) as T) : null),
    set: <T>(k: string, v: T) => void m.set(k, v),
    remove: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
}

function blob(bytes = 8, type = 'audio/webm'): Blob {
  return new Blob([new Uint8Array(bytes)], { type });
}

describe('capability detection', () => {
  it('detects OPFS + IndexedDB + persistence + quota from injected globals', async () => {
    const g: CapabilityGlobals = {
      navigator: {
        storage: {
          getDirectory: async () => ({}),
          persist: async () => true,
          persisted: async () => true,
          estimate: async () => ({ quota: 1000, usage: 200 }),
        },
      },
      indexedDB: {},
    };
    const caps = await detectCapabilities(g);
    expect(caps.opfs).toBe(true);
    expect(caps.indexedDB).toBe(true);
    expect(caps.persistenceApi).toBe(true);
    expect(caps.persistent).toBe(true);
    expect(availableBytes(caps)).toBe(800);
  });

  it('degrades gracefully when nothing is available', async () => {
    const caps = await detectCapabilities({ navigator: {}, indexedDB: undefined });
    expect(caps.opfs).toBe(false);
    expect(caps.indexedDB).toBe(false);
    expect(caps.persistenceApi).toBe(false);
    expect(availableBytes(caps)).toBeUndefined();
  });

  it('requestPersistence returns false when the API is absent', async () => {
    expect(await requestPersistence({ navigator: {} })).toBe(false);
    expect(await requestPersistence({ navigator: { storage: { persist: async () => true } } })).toBe(true);
  });

  it('selects OPFS → IndexedDB → memory by capability', () => {
    expect(selectBlobBackend({ opfs: true, indexedDB: true }).kind).toBe('opfs');
    expect(selectBlobBackend({ opfs: false, indexedDB: true }).kind).toBe('indexeddb');
    expect(selectBlobBackend({ opfs: false, indexedDB: false }).kind).toBe('memory');
  });
});

describe('MemoryBlobBackend', () => {
  it('round-trips put/get/exists/delete', async () => {
    const b = new MemoryBlobBackend();
    await b.put('k', blob(4));
    expect(await b.exists('k')).toBe(true);
    expect((await b.get('k'))?.size).toBe(4);
    await b.delete('k');
    expect(await b.exists('k')).toBe(false);
    expect(await b.get('k')).toBeNull();
  });
});

describe('LocalMediaStore', () => {
  it('saves, reads metadata and blob, and reports existence', async () => {
    const store = new LocalMediaStore(new MemoryBlobBackend(), memMeta(), 'ws1');
    const asset = await store.save({ meetingId: 'm1', blob: blob(16), filename: 'a.webm', mimeType: 'audio/webm', durationMs: 1234 });
    expect(asset.status).toBe('available');
    expect(asset.sizeBytes).toBe(16);
    expect(asset.storageType).toBe('memory');

    expect(store.get(asset.id)?.durationMs).toBe(1234);
    expect(store.getByMeeting('m1')?.id).toBe(asset.id);
    expect(await store.exists(asset.id)).toBe(true);
    expect((await store.getBlob(asset.id))?.size).toBe(16);
  });

  it('persists metadata across store instances sharing the same meta backend (survives refresh)', async () => {
    const meta = memMeta();
    const backend = new MemoryBlobBackend();
    const s1 = new LocalMediaStore(backend, meta, 'ws1');
    const asset = await s1.save({ meetingId: 'm1', blob: blob(8), filename: 'a.webm', mimeType: 'audio/webm' });
    // A fresh store (as after a page reload) sees the same asset + blob.
    const s2 = new LocalMediaStore(backend, meta, 'ws1');
    expect(s2.get(asset.id)?.id).toBe(asset.id);
    expect(await s2.exists(asset.id)).toBe(true);
  });

  it('namespaces by workspace: another workspace cannot see the asset', async () => {
    const meta = memMeta();
    const backend = new MemoryBlobBackend();
    const ws1 = new LocalMediaStore(backend, meta, 'ws1');
    const asset = await ws1.save({ meetingId: 'm1', blob: blob(8), filename: 'a.webm', mimeType: 'audio/webm' });
    const ws2 = new LocalMediaStore(backend, meta, 'ws2');
    expect(ws2.get(asset.id)).toBeNull();
    expect(ws2.list()).toHaveLength(1 - 1);
    // ws1 still sees it.
    expect(ws1.get(asset.id)?.id).toBe(asset.id);
  });

  it('patch/setStatus and delete remove only the local copy', async () => {
    const store = new LocalMediaStore(new MemoryBlobBackend(), memMeta(), 'ws1');
    const asset = await store.save({ meetingId: 'm1', blob: blob(8), filename: 'a.webm', mimeType: 'audio/webm' });
    await store.patch(asset.id, { processingUploadStatus: 'uploaded', remoteProcessingAssetId: 'r1' });
    await store.setStatus(asset.id, 'processed');
    const updated = store.get(asset.id)!;
    expect(updated.processingUploadStatus).toBe('uploaded');
    expect(updated.remoteProcessingAssetId).toBe('r1');
    expect(updated.status).toBe('processed');

    await store.delete(asset.id);
    expect(store.get(asset.id)).toBeNull();
    expect(await store.exists(asset.id)).toBe(false);
  });

  it('propagates a quota error from the backend', async () => {
    const quotaBackend: BlobBackend = {
      kind: 'indexeddb',
      put: async () => {
        throw new LocalMediaQuotaError();
      },
      get: async () => null,
      delete: async () => {},
      exists: async () => false,
    };
    const store = new LocalMediaStore(quotaBackend, memMeta(), 'ws1');
    await expect(store.save({ meetingId: 'm1', blob: blob(8), filename: 'a.webm', mimeType: 'audio/webm' })).rejects.toBeInstanceOf(LocalMediaQuotaError);
    // Nothing was recorded in the index on failure.
    expect(store.list()).toHaveLength(0);
  });
});
