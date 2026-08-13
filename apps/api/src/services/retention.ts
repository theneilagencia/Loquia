import { and, eq, isNotNull, lte, ne, or, sql } from 'drizzle-orm';
import type { ObjectStorageProvider } from '@loquia/pipeline';
import type { Database } from '../db/client';
import type { Env } from '../env';
import { mediaAssets, userSettings } from '../db/schema';
import { writeAudit } from './audit';

/**
 * Media retention (Milestone 5 §34/§35). The policy is derived at upload-complete
 * time from the owner's privacy setting and the deployment default:
 * - storeAudioAfterProcessing = false → `discard_after_processing` (deleted once the
 *   meeting is processed);
 * - else the deployment default `MEDIA_RETENTION_DAYS` (0 = keep forever, else Nd).
 * The transcript and AI Pack are NEVER auto-deleted — only the audio media.
 */
export type RetentionPolicy = 'keep' | '7d' | '30d' | '90d' | 'discard_after_processing';

export function policyForDays(days: number): RetentionPolicy {
  if (days <= 0) return 'keep';
  if (days <= 7) return '7d';
  if (days <= 30) return '30d';
  return '90d';
}

export interface ComputedRetention {
  retentionPolicy: RetentionPolicy;
  expiresAt: Date | null;
}

export function computeRetention(env: Env, storeAudio: boolean, uploadedAt: Date): ComputedRetention {
  if (!storeAudio) return { retentionPolicy: 'discard_after_processing', expiresAt: null };
  const days = env.MEDIA_RETENTION_DAYS;
  if (days <= 0) return { retentionPolicy: 'keep', expiresAt: null };
  return { retentionPolicy: policyForDays(days), expiresAt: new Date(uploadedAt.getTime() + days * 86400_000) };
}

/** Load the meeting owner's "keep audio after processing" preference (default keep). */
export async function ownerStoreAudio(db: Database, ownerId: string): Promise<boolean> {
  const rows = await db.select({ privacy: userSettings.privacy }).from(userSettings).where(eq(userSettings.userId, ownerId)).limit(1);
  const privacy = rows[0]?.privacy as { storeAudioAfterProcessing?: boolean } | undefined;
  return privacy?.storeAudioAfterProcessing ?? true;
}

export interface CleanupDeps {
  db: Database;
  storage: ObjectStorageProvider;
  log?: (event: string, fields: Record<string, unknown>) => void;
}

export interface CleanupResult {
  scanned: number;
  deleted: number;
  failed: number;
}

/**
 * Delete expired media from storage, then mark the asset deleted. Storage delete
 * happens FIRST so a DB update never claims a deletion that didn't happen; if
 * storage fails, the asset is left for the next run (event `cleanup_failed`) —
 * no orphaned R2 object is silently forgotten.
 */
export async function runMediaCleanup(deps: CleanupDeps): Promise<CleanupResult> {
  const { db, storage } = deps;
  const now = new Date();
  const eligible = await db
    .select()
    .from(mediaAssets)
    .where(
      and(
        ne(mediaAssets.status, 'deleted'),
        or(
          and(isNotNull(mediaAssets.expiresAt), lte(mediaAssets.expiresAt, now)),
          // discard-after-processing: delete once the meeting has been processed.
          and(
            eq(mediaAssets.retentionPolicy, 'discard_after_processing'),
            eq(mediaAssets.status, 'ready'),
          ),
        ),
      ),
    )
    .limit(500);

  let deleted = 0;
  let failed = 0;
  for (const asset of eligible) {
    try {
      await storage.deleteObject(asset.objectKey); // storage first
      await db.update(mediaAssets).set({ status: 'deleted', deletedAt: new Date() }).where(eq(mediaAssets.id, asset.id));
      await writeAudit(db, { action: 'media_deleted', actorId: 'system', actorLabel: 'retention', targetType: 'media_asset', targetId: asset.id, targetLabel: asset.objectKey.split('/').pop() ?? asset.id, workspaceId: asset.workspaceId, metadata: { reason: 'retention', policy: asset.retentionPolicy } });
      deps.log?.('media_deleted', { mediaAssetId: asset.id, meetingId: asset.meetingId, policy: asset.retentionPolicy });
      deleted += 1;
    } catch (err) {
      failed += 1;
      deps.log?.('cleanup_failed', { mediaAssetId: asset.id, meetingId: asset.meetingId, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return { scanned: eligible.length, deleted, failed };
}

/** Count media assets currently eligible for cleanup (for smoke/status). */
export async function countEligibleForCleanup(db: Database): Promise<number> {
  const now = new Date();
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(mediaAssets)
    .where(and(ne(mediaAssets.status, 'deleted'), or(and(isNotNull(mediaAssets.expiresAt), lte(mediaAssets.expiresAt, now)), and(eq(mediaAssets.retentionPolicy, 'discard_after_processing'), eq(mediaAssets.status, 'ready')))));
  return rows[0]?.n ?? 0;
}
