import { and, eq, gt, inArray, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import type { Env } from '../env';
import { processingJobs } from '../db/schema';
import { errors } from '../lib/errors';

/**
 * Conservative, configurable operational quotas (Milestone 5 §32/§33). These are
 * protection, not billing — they cap resource abuse. All limits come from env so
 * they can be tuned per deployment.
 */

/** Reject a new upload if the workspace already has too many jobs in flight. */
export async function assertActiveJobLimit(db: Database, env: Env, workspaceId: string): Promise<void> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(processingJobs)
    .where(and(eq(processingJobs.workspaceId, workspaceId), inArray(processingJobs.status, ['queued', 'running'])));
  const active = rows[0]?.n ?? 0;
  if (active >= env.MAX_ACTIVE_PROCESSING_JOBS_PER_WORKSPACE) {
    throw errors.quota('active_processing_jobs', 'Too many meetings are processing; try again shortly.');
  }
}

/** Reject an upload whose declared duration exceeds the configured maximum. */
export function assertDurationLimit(env: Env, durationSeconds: number | undefined): void {
  if (durationSeconds != null && durationSeconds > env.MAX_MEETING_DURATION_SECONDS) {
    throw errors.quota('meeting_duration', 'This recording exceeds the maximum allowed duration.');
  }
}

/** Reject a regeneration if the meeting has been regenerated too often this hour. */
export async function assertRegenerationLimit(db: Database, env: Env, meetingId: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(processingJobs)
    .where(and(eq(processingJobs.meetingId, meetingId), eq(processingJobs.type, 'ai_pack'), gt(processingJobs.createdAt, since)));
  const count = rows[0]?.n ?? 0;
  if (count >= env.MAX_AI_PACK_REGENERATIONS_PER_HOUR) {
    throw errors.quota('ai_pack_regenerations', 'Too many AI Pack regenerations this hour; try again later.');
  }
}
