import { and, asc, desc, eq, ne } from 'drizzle-orm';
import type { Database } from '@loquia/api/db';
import { schema } from '@loquia/api/db';
import {
  PipelineError,
  isRetryable,
  segmentTranscription,
  buildPackSource,
  type AIPackGenerator,
  type AIPackGenerationInput,
  type GenSegment,
  type ObjectStorageProvider,
  type TranscriptionProvider,
} from '@loquia/pipeline';

const { processingJobs, meetings, mediaAssets, transcriptSegments, aiPacks } = schema;

export interface WorkerDeps {
  db: Database;
  storage: ObjectStorageProvider;
  transcription: TranscriptionProvider;
  generator: AIPackGenerator;
  log: (event: string, fields: Record<string, unknown>) => void;
  downloadTtlSeconds?: number;
  /** Enqueue a follow-up job (e.g. the ai_pack job after transcription). */
  enqueue?: (processingJobId: string) => Promise<void>;
}

export interface ProcessResult {
  status: 'completed' | 'failed' | 'skipped';
  segmentCount?: number;
  sectionCount?: number;
  reason?: string;
}

/** Dispatch a job by type. The worker learned to branch on `job.type` in M4. */
export async function processJob(deps: WorkerDeps, processingJobId: string): Promise<ProcessResult> {
  const jobRows = await deps.db.select().from(processingJobs).where(eq(processingJobs.id, processingJobId)).limit(1);
  const job = jobRows[0];
  if (!job) return { status: 'skipped', reason: 'not_found' };
  if (job.status === 'completed') return { status: 'skipped', reason: 'already_completed' };

  if (job.type === 'ai_pack') return processAiPackJob(deps, job);
  return processTranscriptionJob(deps, job);
}

type JobRow = typeof processingJobs.$inferSelect;

/**
 * Media → transcript. Idempotent: re-delivery of a completed job is a no-op, and
 * reprocessing replaces (never duplicates) segments. On success it enqueues a
 * separate `ai_pack` job so AI Pack generation runs asynchronously (§24, §25).
 */
async function processTranscriptionJob(deps: WorkerDeps, job: JobRow): Promise<ProcessResult> {
  const { db, storage, transcription, log } = deps;
  const processingJobId = job.id;

  const now = new Date();
  const claimed = await db
    .update(processingJobs)
    .set({ status: 'running', stage: 'preparing_audio', startedAt: job.startedAt ?? now, attempt: job.attempt ?? 1, updatedAt: now })
    .where(and(eq(processingJobs.id, processingJobId), ne(processingJobs.status, 'completed')))
    .returning();
  if (!claimed[0]) return { status: 'skipped', reason: 'claimed_elsewhere' };

  log('job_started', { processingJobId, meetingId: job.meetingId, workspaceId: job.workspaceId, type: 'transcription' });

  let aiPackJobId: string | null = null;
  try {
    const assetRows = job.mediaAssetId
      ? await db.select().from(mediaAssets).where(eq(mediaAssets.id, job.mediaAssetId)).limit(1)
      : [];
    const asset = assetRows[0];
    if (!asset) throw new PipelineError('invalid_audio', 'Media asset missing');

    const meetingRows = await db.select().from(meetings).where(eq(meetings.id, job.meetingId)).limit(1);
    const meeting = meetingRows[0];
    if (!meeting) throw new PipelineError('invalid_audio', 'Meeting missing');

    await db.update(processingJobs).set({ stage: 'transcribing', updatedAt: new Date() }).where(eq(processingJobs.id, processingJobId));

    const download = await storage.createDownloadUrl({ objectKey: asset.objectKey, ttlSeconds: deps.downloadTtlSeconds ?? 3600 });
    const languageHint = meeting.meetingLanguage && meeting.meetingLanguage !== 'auto' ? meeting.meetingLanguage : undefined;

    log('transcription_started', { processingJobId, provider: transcription.name });
    const result = await transcription.transcribe({ audioUrl: download.url, mimeType: asset.mimeType, languageHint, diarize: true });
    log('transcription_completed', { processingJobId, provider: result.provider, providerRequestId: result.providerRequestId, wordCount: result.words.length });

    await db.update(processingJobs).set({ stage: 'identifying_speakers', updatedAt: new Date() }).where(eq(processingJobs.id, processingJobId));
    const { speakers, segments } = segmentTranscription(result.words);

    const detectedLanguage = result.detectedLanguage ?? meeting.meetingLanguage;
    const durationMs = result.durationMs ?? (segments.length ? segments[segments.length - 1]!.endMs : 0);

    aiPackJobId = await db.transaction(async (tx) => {
      await tx.delete(transcriptSegments).where(eq(transcriptSegments.meetingId, job.meetingId));
      if (segments.length > 0) {
        await tx.insert(transcriptSegments).values(
          segments.map((seg) => ({
            workspaceId: job.workspaceId,
            meetingId: job.meetingId,
            speakerKey: seg.speakerKey,
            orderIndex: seg.sequence,
            sequence: seg.sequence,
            startSeconds: Math.round(seg.startMs / 1000),
            endSeconds: Math.round(seg.endMs / 1000),
            startMs: seg.startMs,
            endMs: seg.endMs,
            text: seg.text,
            confidence: seg.avgConfidence != null ? seg.avgConfidence.toFixed(3) : null,
            language: detectedLanguage,
          })),
        );
      }
      await tx
        .update(meetings)
        .set({ status: 'ready', detectedLanguage, durationSeconds: Math.round(durationMs / 1000), participantCount: speakers.length, speakerAliases: {}, aiPackStatus: 'queued', updatedAt: new Date() })
        .where(eq(meetings.id, job.meetingId));
      await tx.update(mediaAssets).set({ status: 'ready', durationMs }).where(eq(mediaAssets.id, asset.id));
      await tx
        .update(processingJobs)
        .set({
          status: 'completed',
          stage: 'ready_for_ai_pack',
          progress: 100,
          completedAt: new Date(),
          errorCode: null,
          errorMessage: null,
          provider: result.provider,
          providerRequestId: result.providerRequestId,
          model: result.model,
          metrics: { segmentCount: segments.length, wordCount: result.words.length, speakerCount: speakers.length, providerDurationMs: result.durationMs ?? 0 },
          updatedAt: new Date(),
        })
        .where(eq(processingJobs.id, processingJobId));
      // Enqueue AI Pack generation as its own job (async; not in the HTTP request).
      const [aiJob] = await tx
        .insert(processingJobs)
        .values({ workspaceId: job.workspaceId, meetingId: job.meetingId, mediaAssetId: job.mediaAssetId, type: 'ai_pack', status: 'queued', stage: 'ready_for_ai_pack', progress: 0 })
        .returning();
      return aiJob!.id;
    });

    log('transcript_persisted', { processingJobId, meetingId: job.meetingId, segmentCount: segments.length, speakerCount: speakers.length });
    if (aiPackJobId && deps.enqueue) {
      await deps.enqueue(aiPackJobId);
      log('ai_pack_enqueued', { processingJobId, meetingId: job.meetingId, aiPackJobId });
    }
    log('job_completed', { processingJobId, meetingId: job.meetingId });
    return { status: 'completed', segmentCount: segments.length };
  } catch (err) {
    await failJob(deps, job, err, { failMeeting: true });
    throw err;
  }
}

/**
 * Transcript → AI Pack. Idempotent (generationKey is unique per meeting; a
 * retried job that already wrote its version can't create a second current one),
 * and safe on failure (the transcript is never touched). Regeneration flips the
 * current version only at the end, so the old pack stays visible until the new
 * one succeeds (§27, §29).
 */
async function processAiPackJob(deps: WorkerDeps, job: JobRow): Promise<ProcessResult> {
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
    log('ai_pack_generated', { processingJobId, provider: result.provider, model: result.model, sectionCount: source.sections.length, droppedFacts: stats.droppedFacts, citedSegments: stats.citedSegments });

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
    await failJob(deps, job, err, { failMeeting: false });
    if (!isRetryable(err)) {
      await db.update(meetings).set({ aiPackStatus: 'failed', updatedAt: new Date() }).where(eq(meetings.id, job.meetingId));
    }
    throw err;
  }
}

/** Shared failure handling: classify retryable vs permanent, record for audit. */
async function failJob(deps: WorkerDeps, job: JobRow, err: unknown, opts: { failMeeting: boolean }): Promise<void> {
  const { db, log } = deps;
  const retryable = isRetryable(err);
  const category = err instanceof PipelineError ? err.category : 'unknown';
  const message = err instanceof Error ? err.message : String(err);

  await db
    .update(processingJobs)
    .set({ status: retryable ? 'queued' : 'failed', errorCode: category, errorMessage: message.slice(0, 500), attempt: (job.attempt ?? 1) + 1, updatedAt: new Date() })
    .where(eq(processingJobs.id, job.id));
  if (!retryable && opts.failMeeting) {
    await db.update(meetings).set({ status: 'failed', updatedAt: new Date() }).where(eq(meetings.id, job.meetingId));
    if (job.mediaAssetId) await db.update(mediaAssets).set({ status: 'failed' }).where(eq(mediaAssets.id, job.mediaAssetId));
  }
  log('job_failed', { processingJobId: job.id, type: job.type, category, retryable });
}
