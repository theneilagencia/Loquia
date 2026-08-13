import { and, eq, inArray, isNotNull, lte, ne, or, sql } from 'drizzle-orm';
import type { ObjectStorageProvider } from '@loquia/pipeline';
import type { Database } from '../db/client';
import type { Env } from '../env';
import { mediaAssets } from '../db/schema';
import { writeAudit } from './audit';

/**
 * Media retention under **Local First** (Milestone 5 REVISADA). The remote object
 * is a TEMPORARY processing copy, never the archive: the primary recording lives
 * on the user's device. So every new upload is `discard_after_processing` and gets
 * a hard `expiresAt` = uploadedAt + REMOTE_MEDIA_MAX_TTL_HOURS as a safety backstop
 * behind the explicit `delete_processing_media` job. `keep`/`7d`/`30d`/`90d` are
 * LEGACY (pre-Local-First) and only ever read from old rows — never written.
 * The transcript and AI Pack are NEVER auto-deleted — only the temporary media.
 */
export type RetentionPolicy = 'keep' | '7d' | '30d' | '90d' | 'discard_after_processing';

export interface ComputedRetention {
  retentionPolicy: RetentionPolicy;
  expiresAt: Date | null;
}

/** Retention for the temporary remote processing copy: always discard, with a TTL backstop. */
export function computeRetention(env: Env, uploadedAt: Date): ComputedRetention {
  const ttlHours = env.REMOTE_MEDIA_MAX_TTL_HOURS > 0 ? env.REMOTE_MEDIA_MAX_TTL_HOURS : 24;
  return { retentionPolicy: 'discard_after_processing', expiresAt: new Date(uploadedAt.getTime() + ttlHours * 3_600_000) };
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
          // TTL backstop: any temporary copy past its hard expiry (covers stuck uploads).
          and(isNotNull(mediaAssets.expiresAt), lte(mediaAssets.expiresAt, now)),
          // Local First: retry the delete for copies pending/failed cleanup.
          inArray(mediaAssets.status, ['deletion_pending', 'delete_failed']),
          // Legacy: discard-after-processing rows left in the old `ready` state.
          and(eq(mediaAssets.retentionPolicy, 'discard_after_processing'), eq(mediaAssets.status, 'ready')),
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
    .where(and(ne(mediaAssets.status, 'deleted'), or(and(isNotNull(mediaAssets.expiresAt), lte(mediaAssets.expiresAt, now)), inArray(mediaAssets.status, ['deletion_pending', 'delete_failed']), and(eq(mediaAssets.retentionPolicy, 'discard_after_processing'), eq(mediaAssets.status, 'ready')))));
  return rows[0]?.n ?? 0;
}
