import { and, asc, desc, eq, lt, ne, or } from 'drizzle-orm';
import {
  PipelineError,
  isRetryable,
  buildPackSource,
  type AIPackGenerator,
  type AIPackGenerationInput,
  type GenSegment,
} from '@loquia/pipeline';
import { schema, type Database } from '../db';

const { processingJobs, meetings, transcriptSegments, aiPacks } = schema;

export interface JobDeps {
  db: Database;
  generator: AIPackGenerator;
  log: (event: string, fields: Record<string, unknown>) => void;
}

export interface ProcessResult {
  status: 'completed' | 'failed' | 'skipped';
  sectionCount?: number;
  reason?: string;
}

/**
 * AI Pack job dispatch (Milestone 5.2, shared runner). Since R2 was removed and
 * transcription happens inline in the API ingest, the only job type is AI Pack
 * generation (async, storage-independent, Anthropic-backed). Any other type is a
 * no-op. This module is the single source of truth for job processing: the API
 * runs it in-process (default, no Redis) and the optional BullMQ worker calls the
 * same function.
 */
export async function processJob(deps: JobDeps, processingJobId: string): Promise<ProcessResult> {
  const jobRows = await deps.db.select().from(processingJobs).where(eq(processingJobs.id, processingJobId)).limit(1);
  const job = jobRows[0];
  if (!job) return { status: 'skipped', reason: 'not_found' };
  if (job.status === 'completed') return { status: 'skipped', reason: 'already_completed' };
  if (job.type !== 'ai_pack') return { status: 'skipped', reason: `unsupported_type:${job.type}` };
  return processAiPackJob(deps, job);
}

type JobRow = typeof processingJobs.$inferSelect;

/**
 * Transcript → AI Pack. Idempotent (generationKey is unique per meeting; a
 * retried job that already wrote its version can't create a second current one),
 * and safe on failure (the transcript is never touched). Regeneration flips the
 * current version only at the end, so the old pack stays visible until the new
 * one succeeds (§27, §29).
 */
async function processAiPackJob(deps: JobDeps, job: JobRow): Promise<ProcessResult> {
  const { db, generator, log } = deps;
  const processingJobId = job.id;

  const now = new Date();
  const claimed = await db
    .update(processingJobs)
    .set({ status: 'running', startedAt: job.startedAt ?? now, attempt: job.attempt ?? 1, updatedAt: now })
    .where(and(eq(processingJobs.id, processingJobId), ne(processingJobs.status, 'completed')))
    .returning();
  if (!claimed[0]) return { status: 'skipped', reason: 'claimed_elsewhere' };

  log('job_started', { processingJobId, meetingId: job.meetingId, workspaceId: job.workspaceId, type: 'ai_pack' });

  try {
    const meetingRows = await db.select().from(meetings).where(eq(meetings.id, job.meetingId)).limit(1);
    const meeting = meetingRows[0];
    if (!meeting) throw new PipelineError('invalid_audio', 'Meeting missing');

    const segRows = await db
      .select()
      .from(transcriptSegments)
      .where(eq(transcriptSegments.meetingId, job.meetingId))
      .orderBy(asc(transcriptSegments.orderIndex));
    if (segRows.length === 0) throw new PipelineError('unsupported_media', 'No transcript to summarize'); // permanent

    await db.update(meetings).set({ aiPackStatus: 'generating', updatedAt: new Date() }).where(eq(meetings.id, job.meetingId));

    // Neutral speaker labels (Speaker 1, Speaker 2, …) mapped from stable keys.
    const keys = [...new Set(segRows.map((s) => s.speakerKey))];
    const aliases = meeting.speakerAliases ?? {};
    const labelFor = (key: string) => aliases[key] ?? `Speaker ${keys.indexOf(key) + 1}`;
    const genSegments: GenSegment[] = segRows.map((s) => ({
      id: s.id,
      speakerId: s.speakerKey,
      speakerLabel: labelFor(s.speakerKey),
      startSeconds: s.startSeconds,
      endSeconds: s.endSeconds,
      text: s.text,
    }));

    const outputLanguage = meeting.detectedLanguage ?? meeting.meetingLanguage;
    const input: AIPackGenerationInput = {
      meeting: {
        id: meeting.id,
        workspaceId: meeting.workspaceId,
        title: meeting.title,
        language: outputLanguage,
        source: meeting.source,
        durationSeconds: meeting.durationSeconds,
      },
      participants: keys.map((k) => ({ name: labelFor(k) })),
      transcript: genSegments,
      outputLanguage,
    };

    log('ai_pack_generation_started', { processingJobId, provider: generator.name, model: generator.model, segmentCount: genSegments.length });
    const result = await generator.generate(input);
    // Validate + resolve evidence against the REAL segments (reject hallucinated ids).
    const { source, stats } = buildPackSource(input, result.sections, genSegments);
    log('ai_pack_generated', { processingJobId, provider: result.provider, model: result.model, sectionCount: source.sections.length, totalFacts: stats.totalFacts, droppedFacts: stats.droppedFacts, unresolvedEvidence: stats.unresolvedEvidence, citedSegments: stats.citedSegments });

    await db.transaction(async (tx) => {
      // Idempotent: if this job already wrote its version, do nothing.
      const existing = await tx.select({ id: aiPacks.id }).from(aiPacks).where(and(eq(aiPacks.meetingId, job.meetingId), eq(aiPacks.generationKey, processingJobId))).limit(1);
      if (existing[0]) return;

      const prev = await tx.select({ version: aiPacks.version }).from(aiPacks).where(eq(aiPacks.meetingId, job.meetingId)).orderBy(desc(aiPacks.version)).limit(1);
      const nextVersion = (prev[0]?.version ?? 0) + 1;

      // Regeneration flips current only now — the old version stayed visible until here.
      await tx.update(aiPacks).set({ isCurrent: false }).where(eq(aiPacks.meetingId, job.meetingId));
      await tx.insert(aiPacks).values({
        workspaceId: job.workspaceId,
        meetingId: job.meetingId,
        version: nextVersion,
        isCurrent: true,
        status: 'ready',
        outputLanguage,
        provider: result.provider,
        model: result.model,
        promptVersion: result.promptVersion,
        schemaVersion: result.schemaVersion,
        generationKey: processingJobId,
        sourceSections: source.sections,
        metrics: {
          sectionCount: source.sections.length,
          droppedFacts: stats.droppedFacts,
          citedSegments: stats.citedSegments,
          inputTokens: result.usage?.inputTokens ?? 0,
          outputTokens: result.usage?.outputTokens ?? 0,
          requestCount: result.usage?.requestCount ?? 0,
        },
      });
      await tx.update(meetings).set({ aiPackStatus: 'ready', updatedAt: new Date() }).where(eq(meetings.id, job.meetingId));
      await tx
        .update(processingJobs)
        .set({ status: 'completed', stage: 'ready_for_ai_pack', progress: 100, completedAt: new Date(), errorCode: null, errorMessage: null, provider: result.provider, model: result.model, metrics: { sectionCount: source.sections.length, droppedFacts: stats.droppedFacts }, updatedAt: new Date() })
        .where(eq(processingJobs.id, processingJobId));
    });

    log('ai_pack_persisted', { processingJobId, meetingId: job.meetingId });
    log('job_completed', { processingJobId, meetingId: job.meetingId });
    return { status: 'completed', sectionCount: source.sections.length };
  } catch (err) {
    // Failure preserves the transcript AND any current AI Pack; only mark status.
    // `terminal` is true when the job is left in a permanent `failed` state —
    // either a non-retryable error OR a retryable one that exhausted its attempts.
    // Only then is the meeting's AI Pack marked `failed`; while retries remain the
    // meeting stays `generating` so the UI keeps showing honest progress rather
    // than flashing a failure between attempts.
    const terminal = await failJob(deps, job, err);
    if (terminal) {
      await db.update(meetings).set({ aiPackStatus: 'failed', updatedAt: new Date() }).where(eq(meetings.id, job.meetingId));
    }
    // In-process mode has no BullMQ to re-deliver: swallow retryable errors (the
    // job is back to `queued` and the poll loop / next kick retries it). Rethrow
    // so the BullMQ worker path still sees the failure and applies its backoff.
    throw err;
  }
}

/**
 * Shared failure handling: classify retryable vs permanent, record for audit.
 * A retryable error is re-queued for another attempt UNTIL `maxAttempts` is
 * reached, after which it is marked `failed` so a transient-but-persistent
 * problem (e.g. repeated provider timeouts on a long transcript) can never loop
 * forever and leave the meeting stuck. Returns whether the job was left in a
 * terminal `failed` state.
 */
async function failJob(deps: JobDeps, job: JobRow, err: unknown): Promise<boolean> {
  const { db, log } = deps;
  const category = err instanceof PipelineError ? err.category : 'unknown';
  const message = err instanceof Error ? err.message : String(err);

  const nextAttempt = (job.attempt ?? 1) + 1;
  const exhausted = nextAttempt > (job.maxAttempts ?? 3);
  const willRetry = isRetryable(err) && !exhausted;
  const status = willRetry ? 'queued' : 'failed';

  await db
    .update(processingJobs)
    .set({ status, errorCode: category, errorMessage: message.slice(0, 500), attempt: nextAttempt, updatedAt: new Date() })
    .where(eq(processingJobs.id, job.id));
  log('job_failed', { processingJobId: job.id, type: job.type, category, retryable: isRetryable(err), attempt: nextAttempt, maxAttempts: job.maxAttempts ?? 3, willRetry });
  return !willRetry;
}

/**
 * In-process AI Pack runner — the default processing path when there is no Redis
 * (Render free plan: no separate paid worker). The API drains queued `ai_pack`
 * jobs from Postgres itself:
 *
 *  - `kick()` is called after a job is inserted (e.g. the Deepgram callback) and
 *    triggers a non-blocking drain, so the HTTP request returns immediately.
 *  - `start()` runs one drain on boot (reconciles jobs left behind by a previous
 *    process — Render free instances spin down) and then polls periodically to
 *    pick up retryable jobs that failure reset to `queued`.
 *  - A `running` job older than the stale threshold is reclaimable, so a job
 *    interrupted by a spin-down/crash is retried on the next drain.
 *
 * A single-flight mutex guarantees only one drain runs at a time; the DB claim in
 * `processAiPackJob` is the real concurrency guard, and `generationKey` keeps it
 * idempotent, so a stray double-drain can never write two current packs.
 */
export interface JobRunner {
  kick: () => void;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

const DEFAULT_POLL_MS = 15_000;
const DEFAULT_STALE_MS = 90_000; // a `running` job older than this is presumed abandoned (fast recovery)

export function createInProcessRunner(deps: JobDeps, opts: { pollMs?: number; staleMs?: number } = {}): JobRunner {
  const pollMs = opts.pollMs ?? DEFAULT_POLL_MS;
  const staleMs = opts.staleMs ?? DEFAULT_STALE_MS;
  let draining = false;
  let pending = false; // a kick arrived while draining → drain once more
  let timer: ReturnType<typeof setInterval> | undefined;
  let stopped = false;

  async function nextJobId(): Promise<string | undefined> {
    const staleBefore = new Date(Date.now() - staleMs);
    const rows = await deps.db
      .select({ id: processingJobs.id })
      .from(processingJobs)
      .where(
        and(
          eq(processingJobs.type, 'ai_pack'),
          or(eq(processingJobs.status, 'queued'), and(eq(processingJobs.status, 'running'), lt(processingJobs.updatedAt, staleBefore))),
        ),
      )
      .orderBy(asc(processingJobs.createdAt))
      .limit(1);
    return rows[0]?.id;
  }

  /**
   * On boot, any `ai_pack` job still marked `running` is orphaned — the process
   * that was running it is gone (a redeploy/restart) — so reset it to `queued`
   * for immediate re-pickup instead of waiting out the stale window. This is
   * what makes generation self-heal instantly across the frequent redeploys of
   * this single-instance in-process runner, rather than stranding a meeting in
   * "generating" for minutes.
   */
  async function reclaimOrphaned(): Promise<void> {
    try {
      const reset = await deps.db
        .update(processingJobs)
        .set({ status: 'queued', updatedAt: new Date() })
        .where(and(eq(processingJobs.type, 'ai_pack'), eq(processingJobs.status, 'running')))
        .returning({ id: processingJobs.id });
      if (reset.length > 0) deps.log('ai_pack_orphans_reclaimed', { count: reset.length });
    } catch (err) {
      deps.log('ai_pack_reclaim_error', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  async function drain(): Promise<void> {
    if (draining) {
      pending = true;
      return;
    }
    draining = true;
    try {
      do {
        pending = false;
        // Process actionable jobs one at a time until the queue is empty.
        for (let id = await nextJobId(); id && !stopped; id = await nextJobId()) {
          try {
            await processJob(deps, id);
          } catch (err) {
            // Failure is already recorded on the job row; don't let one bad job
            // stop the drain. A retryable job is back to `queued`, but re-picking
            // it immediately would spin — leave it for the next poll tick.
            deps.log('in_process_job_error', { processingJobId: id, error: err instanceof Error ? err.message : String(err) });
            break;
          }
        }
      } while (pending && !stopped);
    } finally {
      draining = false;
    }
  }

  return {
    kick() {
      if (stopped) return;
      void drain();
    },
    async start() {
      stopped = false;
      await reclaimOrphaned(); // a fresh process owns no running job → reclaim them
      await drain(); // startup reconcile: finish anything a prior process left queued
      timer = setInterval(() => void drain(), pollMs);
      // Don't keep the event loop alive just for the poller.
      timer.unref?.();
    },
    async stop() {
      stopped = true;
      if (timer) clearInterval(timer);
      timer = undefined;
      // Let an in-flight drain settle.
      for (let i = 0; i < 50 && draining; i += 1) await new Promise((r) => setTimeout(r, 20));
    },
  };
}
