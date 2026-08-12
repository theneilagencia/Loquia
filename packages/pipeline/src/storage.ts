/** Object storage abstraction (task §3). No SDK leaks into services. */

export interface PresignedUpload {
  url: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
}

export interface PresignedDownload {
  url: string;
  expiresAt: string;
}

export interface ObjectStat {
  exists: boolean;
  sizeBytes?: number;
  contentType?: string;
}

export interface CreateUploadInput {
  objectKey: string;
  contentType: string;
  sizeBytes?: number;
  ttlSeconds: number;
}

export interface ObjectStorageProvider {
  readonly name: string;
  createUploadUrl(input: CreateUploadInput): Promise<PresignedUpload>;
  createDownloadUrl(input: { objectKey: string; ttlSeconds: number }): Promise<PresignedDownload>;
  headObject(objectKey: string): Promise<ObjectStat>;
  getObject(objectKey: string): Promise<Uint8Array>;
  deleteObject(objectKey: string): Promise<void>;
}
