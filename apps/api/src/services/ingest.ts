/**
 * Direct audio ingest (Milestone 5.2). The API receives the temporary audio,
 * submits it straight to the transcription provider (Deepgram) — no object
 * storage — persists the transcript, enqueues the AI Pack job, and discards the
 * media. Runs detached from the HTTP request so the request returns fast (§7);
 * the ProcessingJob is the source of state (§12). The API and worker are separate
 * instances, so the worker only ever does the (storage-independent) AI Pack job.
 */
import { readFile } from 'node:fs/promises';
import { and, eq, ne } from 'drizzle-orm';
import { PipelineError, isRetryable, segmentTranscription, type TranscriptionProvider } from '@loquia/pipeline';
import type { Database } from '../db/client';
import { meetings, processingJobs, transcriptSegments } from '../db/schema';
import { removeTempFile } from './temp-media';

export type IngestFailureCategory = 'needs_reupload' | 'permanent';

export interface IngestDeps {
  db: Database;
  transcription: TranscriptionProvider;
  enqueue: (processingJobId: string) => Promise<void>;
  log: (event: string, fields: Record<string, unknown>) => void;
  /** STT wall-clock budget; on timeout the attempt is a transient failure. */
  sttTimeoutMs?: number;
}

export interface IngestJobInput {
  processingJobId: string;
  meetingId: string;
  workspaceId: string;
  tempPath: string;
  mimeType: string;
  sizeBytes: number;
  languageHint?: string;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) => setTimeout(() => reject(new PipelineError('provider_timeout', 'STT timed out')), ms)),
  ]);
}

/**
 * Run the STT → transcript → AI Pack step. Deletes the temp media in `finally`.
 * Resolves with the outcome; never throws (it is called detached).
 */
export async function runIngest(deps: IngestDeps, input: IngestJobInput): Promise<{ status: 'completed' | 'failed'; category?: IngestFailureCategory }> {
  const { db, transcription, log } = deps;
  const { processingJobId, meetingId, workspaceId, tempPath, mimeType } = input;
  const timeout = deps.sttTimeoutMs ?? 120_000;

  try {
    await db.update(processingJobs).set({ status: 'running', stage: 'transcribing', startedAt: new Date(), updatedAt: new Date() }).where(eq(processingJobs.id, processingJobId));
    log('ingest_started', { processingJobId, meetingId, workspaceId, sizeBytes: input.sizeBytes });

    const bytes = new Uint8Array(await readFile(tempPath));

    log('stt_submission_started', { processingJobId, provider: transcription.name });
    const started = Date.now();
    const result = await withTimeout(transcription.transcribe({ audio: bytes, mimeType, languageHint: input.languageHint, diarize: true }), timeout);
    log('transcription_completed', { processingJobId, provider: result.provider, providerRequestId: result.providerRequestId, wordCount: result.words.length, sttDurationMs: Date.now() - started });

    const { speakers, segments } = segmentTranscription(result.words);
    const detectedLanguage = result.detectedLanguage ?? input.languageHint ?? 'pt-BR';
    const durationMs = result.durationMs ?? (segments.length ? segments[segments.length - 1]!.endMs : 0);

    const aiPackJobId = await db.transaction(async (tx) => {
      // Confirm the meeting still exists (not deleted mid-flight).
      const m = (await tx.select({ id: meetings.id }).from(meetings).where(eq(meetings.id, meetingId)).limit(1))[0];
      if (!m) throw new PipelineError('unsupported_media', 'Meeting removed');

      await tx.delete(transcriptSegments).where(eq(transcriptSegments.meetingId, meetingId));
      if (segments.length > 0) {
        await tx.insert(transcriptSegments).values(
          segments.map((seg) => ({
            workspaceId,
            meetingId,
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
      await tx.update(meetings).set({ status: 'ready', detectedLanguage, durationSeconds: Math.round(durationMs / 1000), participantCount: speakers.length, speakerAliases: {}, aiPackStatus: 'queued', updatedAt: new Date() }).where(eq(meetings.id, meetingId));
      await tx
        .update(processingJobs)
        .set({ status: 'completed', stage: 'ready_for_ai_pack', progress: 100, completedAt: new Date(), errorCode: null, errorMessage: null, provider: result.provider, providerRequestId: result.providerRequestId, model: result.model, metrics: { segmentCount: segments.length, wordCount: result.words.length, speakerCount: speakers.length, sizeBytes: input.sizeBytes }, updatedAt: new Date() })
        .where(eq(processingJobs.id, processingJobId));
      const [aiJob] = await tx
        .insert(processingJobs)
        .values({ workspaceId, meetingId, type: 'ai_pack', status: 'queued', stage: 'ready_for_ai_pack', progress: 0 })
        .returning();
      return aiJob!.id;
    });

    log('transcript_persisted', { processingJobId, meetingId, segmentCount: segments.length, speakerCount: speakers.length });
    await deps.enqueue(aiPackJobId);
    log('ai_pack_enqueued', { processingJobId, meetingId, aiPackJobId });
    log('ingest_completed', { processingJobId, meetingId });
    return { status: 'completed' };
  } catch (err) {
    // Media is discarded after each attempt, so a transient failure becomes a
    // "needs local re-upload" (§13/§14); a provider rejection is permanent (§15).
    const permanent = err instanceof PipelineError && !isRetryable(err);
    const category: IngestFailureCategory = permanent ? 'permanent' : 'needs_reupload';
    const message = err instanceof Error ? err.message : String(err);
    await db.update(processingJobs).set({ status: 'failed', stage: 'transcribing', errorCode: category, errorMessage: message.slice(0, 500), updatedAt: new Date() }).where(and(eq(processingJobs.id, processingJobId), ne(processingJobs.status, 'completed'))).catch(() => undefined);
    await db.update(meetings).set({ status: 'failed', updatedAt: new Date() }).where(eq(meetings.id, meetingId)).catch(() => undefined);
    log('ingest_failed', { processingJobId, meetingId, category, error: message });
    return { status: 'failed', category };
  } finally {
    await removeTempFile(tempPath);
  }
}
