import { and, eq, ne } from 'drizzle-orm';
import type { Database } from '@loquia/api/db';
import { schema } from '@loquia/api/db';
import {
  PipelineError,
  isRetryable,
  segmentTranscription,
  type ObjectStorageProvider,
  type TranscriptionProvider,
} from '@loquia/pipeline';

const { processingJobs, meetings, mediaAssets, transcriptSegments } = schema;

export interface WorkerDeps {
  db: Database;
  storage: ObjectStorageProvider;
  transcription: TranscriptionProvider;
  log: (event: string, fields: Record<string, unknown>) => void;
  downloadTtlSeconds?: number;
}

export interface ProcessResult {
  status: 'completed' | 'failed' | 'skipped';
  segmentCount?: number;
  reason?: string;
}

/**
 * Process one ProcessingJob: claim → load media → STT → diarization →
 * segmentation → persist transcript. Idempotent: re-delivery of a completed job
 * is a no-op, and reprocessing replaces (never duplicates) segments.
 */
export async function processJob(deps: WorkerDeps, processingJobId: string): Promise<ProcessResult> {
  const { db, storage, transcription, log } = deps;

  const jobRows = await db.select().from(processingJobs).where(eq(processingJobs.id, processingJobId)).limit(1);
  const job = jobRows[0];
  if (!job) return { status: 'skipped', reason: 'not_found' };
  if (job.status === 'completed') return { status: 'skipped', reason: 'already_completed' };

  // Claim: move to running unless already completed (guards re-delivery).
  const now = new Date();
  const claimed = await db
    .update(processingJobs)
    .set({ status: 'running', stage: 'preparing_audio', startedAt: job.startedAt ?? now, attempt: (job.attempt ?? 1), updatedAt: now })
    .where(and(eq(processingJobs.id, processingJobId), ne(processingJobs.status, 'completed')))
    .returning();
  if (!claimed[0]) return { status: 'skipped', reason: 'claimed_elsewhere' };

  log('job_started', { processingJobId, meetingId: job.meetingId, workspaceId: job.workspaceId });

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

    // A short-lived URL the provider can fetch directly (real bucket stays private).
    const download = await storage.createDownloadUrl({ objectKey: asset.objectKey, ttlSeconds: deps.downloadTtlSeconds ?? 3600 });
    const languageHint = meeting.meetingLanguage && meeting.meetingLanguage !== 'auto' ? meeting.meetingLanguage : undefined;

    log('transcription_started', { processingJobId, provider: transcription.name });
    const result = await transcription.transcribe({ audioUrl: download.url, mimeType: asset.mimeType, languageHint, diarize: true });
    log('transcription_completed', { processingJobId, provider: result.provider, providerRequestId: result.providerRequestId, wordCount: result.words.length, providerDurationMs: result.durationMs });

    await db.update(processingJobs).set({ stage: 'identifying_speakers', updatedAt: new Date() }).where(eq(processingJobs.id, processingJobId));
    const { speakers, segments } = segmentTranscription(result.words);

    const detectedLanguage = result.detectedLanguage ?? meeting.meetingLanguage;
    const durationMs = result.durationMs ?? (segments.length ? segments[segments.length - 1]!.endMs : 0);

    await db.transaction(async (tx) => {
      // Idempotent replacement: remove any previous segments for this meeting.
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
      // Fresh diarization → reset speaker aliases to technical labels.
      await tx
        .update(meetings)
        .set({ status: 'ready', detectedLanguage, durationSeconds: Math.round(durationMs / 1000), participantCount: speakers.length, speakerAliases: {}, updatedAt: new Date() })
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
    });

    log('transcript_persisted', { processingJobId, meetingId: job.meetingId, segmentCount: segments.length, speakerCount: speakers.length });
    log('job_completed', { processingJobId, meetingId: job.meetingId });
    return { status: 'completed', segmentCount: segments.length };
  } catch (err) {
    const retryable = isRetryable(err);
    const category = err instanceof PipelineError ? err.category : 'unknown';
    const message = err instanceof Error ? err.message : String(err);

    // Detailed technical error is stored for audit, not surfaced to the UI.
    await db
      .update(processingJobs)
      .set({
        status: retryable ? 'queued' : 'failed',
        errorCode: category,
        errorMessage: message.slice(0, 500),
        attempt: (job.attempt ?? 1) + 1,
        updatedAt: new Date(),
      })
      .where(eq(processingJobs.id, processingJobId));
    if (!retryable) {
      await db.update(meetings).set({ status: 'failed', updatedAt: new Date() }).where(eq(meetings.id, job.meetingId));
      if (job.mediaAssetId) await db.update(mediaAssets).set({ status: 'failed' }).where(eq(mediaAssets.id, job.mediaAssetId));
    }
    log('job_failed', { processingJobId, category, retryable });
    throw err; // BullMQ decides retry vs fail based on attempts config
  }
}
