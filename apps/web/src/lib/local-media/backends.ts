/**
 * Blob backends for the LocalMediaStore. OPFS is preferred, IndexedDB is the
 * fallback (§9/§10), and an in-memory backend covers SSR/tests. All three share
 * the same async contract so the store is backend-agnostic. Quota failures are
 * normalized to LocalMediaQuotaError so the UI can respond consistently (§13).
 */
import { type BlobBackend, type BlobBackendKind, LocalMediaQuotaError } from './types';

function isQuotaError(err: unknown): boolean {
  if (typeof DOMException !== 'undefined' && err instanceof DOMException) {
    return err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED';
  }
  const name = (err as { name?: string })?.name;
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED';
}

/** In-memory backend (SSR / tests). Not persistent — the store reports this honestly. */
export class MemoryBlobBackend implements BlobBackend {
  readonly kind: BlobBackendKind = 'memory';
  private readonly map = new Map<string, Blob>();
  async put(key: string, blob: Blob): Promise<void> {
    this.map.set(key, blob);
  }
  async get(key: string): Promise<Blob | null> {
    return this.map.get(key) ?? null;
  }
  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }
  async exists(key: string): Promise<boolean> {
    return this.map.has(key);
  }
}

/** OPFS backend — one flat file per key (slashes replaced) under a root directory. */
export class OpfsBlobBackend implements BlobBackend {
  readonly kind: BlobBackendKind = 'opfs';
  constructor(private readonly rootName = 'loquia-media') {}

  private async dir(): Promise<FileSystemDirectoryHandle> {
    const storage = navigator.storage as StorageManager & { getDirectory: () => Promise<FileSystemDirectoryHandle> };
    const root = await storage.getDirectory();
    return root.getDirectoryHandle(this.rootName, { create: true });
  }
  private fileName(key: string): string {
    return key.replace(/\//g, '__');
  }
  async put(key: string, blob: Blob): Promise<void> {
    try {
      const dir = await this.dir();
      const handle = await dir.getFileHandle(this.fileName(key), { create: true });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (err) {
      if (isQuotaError(err)) throw new LocalMediaQuotaError();
      throw err;
    }
  }
  async get(key: string): Promise<Blob | null> {
    try {
      const dir = await this.dir();
      const handle = await dir.getFileHandle(this.fileName(key));
      return await handle.getFile();
    } catch {
      return null;
    }
  }
  async delete(key: string): Promise<void> {
    try {
      const dir = await this.dir();
      await dir.removeEntry(this.fileName(key));
    } catch {
      /* already gone */
    }
  }
  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) != null;
  }
}

/** IndexedDB backend — a single object store of Blobs keyed by the namespaced key. */
export class IndexedDbBlobBackend implements BlobBackend {
  readonly kind: BlobBackendKind = 'indexeddb';
  private readonly dbName: string;
  private readonly storeName = 'blobs';
  constructor(dbName = 'loquia-media') {
    this.dbName = dbName;
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this.storeName)) db.createObjectStore(this.storeName);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  private async tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(this.storeName, mode);
      const store = transaction.objectStore(this.storeName);
      const request = fn(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(isQuotaError(request.error) ? new LocalMediaQuotaError() : request.error);
      transaction.oncomplete = () => db.close();
    });
  }
  async put(key: string, blob: Blob): Promise<void> {
    try {
      await this.tx('readwrite', (s) => s.put(blob, key));
    } catch (err) {
      if (isQuotaError(err) || err instanceof LocalMediaQuotaError) throw new LocalMediaQuotaError();
      throw err;
    }
  }
  async get(key: string): Promise<Blob | null> {
    const val = await this.tx<Blob | undefined>('readonly', (s) => s.get(key) as IDBRequest<Blob | undefined>);
    return val ?? null;
  }
  async delete(key: string): Promise<void> {
    await this.tx('readwrite', (s) => s.delete(key));
  }
  async exists(key: string): Promise<boolean> {
    const count = await this.tx<number>('readonly', (s) => s.count(key));
    return count > 0;
  }
}

/** Pick the best available backend: OPFS → IndexedDB → memory. */
export function selectBlobBackend(caps: { opfs: boolean; indexedDB: boolean }): BlobBackend {
  if (caps.opfs) return new OpfsBlobBackend();
  if (caps.indexedDB) return new IndexedDbBlobBackend();
  return new MemoryBlobBackend();
}
