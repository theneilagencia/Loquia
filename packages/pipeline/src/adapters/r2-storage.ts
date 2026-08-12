import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PipelineError } from '../errors';
import type {
  CreateUploadInput,
  ObjectStat,
  ObjectStorageProvider,
  PresignedDownload,
  PresignedUpload,
} from '../storage';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

/**
 * Cloudflare R2 via the S3-compatible API (task §2, §4). The bucket is private;
 * the browser only ever sees short-lived presigned URLs — never credentials.
 */
export class R2StorageAdapter implements ObjectStorageProvider {
  readonly name = 'r2';
  private readonly client: S3Client;

  constructor(private readonly config: R2Config) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async createUploadUrl(input: CreateUploadInput): Promise<PresignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: input.objectKey,
      ContentType: input.contentType,
      ...(input.sizeBytes != null ? { ContentLength: input.sizeBytes } : {}),
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: input.ttlSeconds });
    return {
      url,
      method: 'PUT',
      headers: { 'content-type': input.contentType },
      expiresAt: new Date(Date.now() + input.ttlSeconds * 1000).toISOString(),
    };
  }

  async createDownloadUrl(input: { objectKey: string; ttlSeconds: number }): Promise<PresignedDownload> {
    const command = new GetObjectCommand({ Bucket: this.config.bucket, Key: input.objectKey });
    const url = await getSignedUrl(this.client, command, { expiresIn: input.ttlSeconds });
    return { url, expiresAt: new Date(Date.now() + input.ttlSeconds * 1000).toISOString() };
  }

  async headObject(objectKey: string): Promise<ObjectStat> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.config.bucket, Key: objectKey }));
      return { exists: true, sizeBytes: res.ContentLength, contentType: res.ContentType };
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404 || status === 403) return { exists: false };
      throw new PipelineError('storage_access', 'R2 head failed', err);
    }
  }

  async getObject(objectKey: string): Promise<Uint8Array> {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.config.bucket, Key: objectKey }));
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes) throw new PipelineError('storage_access', 'Empty object body');
      return bytes;
    } catch (err) {
      if (err instanceof PipelineError) throw err;
      throw new PipelineError('storage_access', 'R2 get failed', err);
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: objectKey }));
    } catch (err) {
      throw new PipelineError('storage_access', 'R2 delete failed', err);
    }
  }
}
