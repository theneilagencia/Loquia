/**
 * Local First media model (Milestone 5 REVISADA). The original recording is the
 * PRIMARY copy and lives on the user's device. The remote object storage is only
 * a temporary processing buffer. These types describe the on-device asset; the
 * backend never treats them as the authority over the file.
 */

/** Local-only lifecycle, separate from the remote processing status. */
export type LocalMediaStatus =
  | 'recording'
  | 'saving'
  | 'available'
  | 'processing_upload'
  | 'processing'
  | 'processed'
  | 'missing'
  | 'error';

export interface LocalMediaAsset {
  id: string;
  meetingId: string;
  /** Which on-device backend holds the blob (opfs | indexeddb | memory). */
  storageType: BlobBackendKind;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;
  status: LocalMediaStatus;
  createdAt: string;
  updatedAt: string;
  /** Remote temporary-processing status, if a copy was sent for processing. */
  processingUploadStatus?: 'idle' | 'uploading' | 'uploaded' | 'failed';
  /** The remote (temporary) processing asset id, when one exists. */
  remoteProcessingAssetId?: string;
}

export type BlobBackendKind = 'opfs' | 'indexeddb' | 'memory';

/**
 * Low-level blob persistence. Implemented by OPFS, IndexedDB, and an in-memory
 * fallback. The store composes one of these with a small metadata index. Keys are
 * already namespaced by the store (workspace/meeting/asset), so backends treat
 * them as opaque strings.
 */
export interface BlobBackend {
  readonly kind: BlobBackendKind;
  put(key: string, blob: Blob): Promise<void>;
  get(key: string): Promise<Blob | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/** Raised when the device has no room for the recording (quota exceeded). */
export class LocalMediaQuotaError extends Error {
  constructor(message = 'Local storage quota exceeded') {
    super(message);
    this.name = 'LocalMediaQuotaError';
  }
}

export interface SaveLocalMediaInput {
  meetingId: string;
  blob: Blob;
  filename: string;
  mimeType: string;
  durationMs?: number;
}
