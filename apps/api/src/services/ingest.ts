/**
 * Direct audio ingest — ASYNC callback model (Milestone 5.2, adjusted). The API
 * NEVER runs long transcription work after the HTTP response (Render web dynos can
 * restart/redeploy and lose detached promises). Instead:
 *   1. `submitForTranscription` streams-in the audio, submits it to the provider
 *      with a callback URL, persists the provider request id, marks the job
 *      `submitted_to_stt`, and returns — the request ends here.
 *   2. the provider POSTs the finished result to our webhook, which calls
 *      `applyTranscriptionCallback` to map + persist the transcript and enqueue
 *      the AI Pack. That step is idempotent.
 * There is no object storage; the temp file exists only during submission.
 */
import { readFile } from 'node:fs/promises';
import { and, eq, ne } from 'drizzle-orm';
import { PipelineError, isRetryable, segmentTranscription, type TranscriptionCallbackOutcome, type TranscriptionProvider } from '@loquia/pipeline';
import type { Database } from '../db/client';
import { meetings, processingJobs, transcriptSegments } from '../db/schema';
import { removeTempFile } from './temp-media';

export type IngestFailureCategory = 'needs_reupload' | 'permanent';

export interface IngestDeps {
  db: Database;
  transcription: TranscriptionProvider;
  enqueue: (processingJobId: string) => Promise<void>;
  log: (event: string, fields: Record<string, unknown>) => void;
}

export interface SubmitInput {
  processingJobId: string;
  meetingId: string;
  workspaceId: string;
  tempPath: string;
  mimeType: string;
  sizeBytes: number;
  languageHint?: string;
  callbackUrl: string;
}

/** Map a provider/pipeline failure to the retry category (media is discarded each attempt). */
function failureCategory(err: unknown): IngestFailureCategory {
  return err instanceof PipelineError && !isRetryable(err) ? 'permanent' : 'needs_reupload';
}

/**
 * Phase 1 — submit the audio to the transcription provider and return. The temp
 * file is deleted in `finally`: once the provider has accepted the request, no
 * instance ever needs the bytes again (§11). Never throws (called inline by the
 * route, which has already responded semantics — but here we await before 202).
 */
export async function submitForTranscription(deps: IngestDeps, input: SubmitInput): Promise<{ ok: true; providerRequestId: string } | { ok: false; category: IngestFailureCategory }> {
  const { db, transcription, log } = deps;
  const { processingJobId, meetingId, workspaceId, tempPath, mimeType } = input;
  try {
    await db.update(processingJobs).set({ status: 'running', stage: 'transcribing', startedAt: new Date(), updatedAt: new Date() }).where(eq(processingJobs.id, processingJobId));
    log('stt_submission_started', { processingJobId, meetingId, workspaceId, provider: transcription.name, sizeBytes: input.sizeBytes });

    const bytes = new Uint8Array(await readFile(tempPath));
    const started = Date.now();
    const submission = await transcription.submit({ audio: bytes, mimeType, languageHint: input.languageHint, diarize: true, callbackUrl: input.callbackUrl });

    await db.update(processingJobs).set({ provider: transcription.name, providerRequestId: submission.providerRequestId, updatedAt: new Date() }).where(eq(processingJobs.id, processingJobId));
    log('submitted_to_stt', { processingJobId, meetingId, provider: transcription.name, providerRequestId: submission.providerRequestId, sttSubmissionMs: Date.now() - started });
    return { ok: true, providerRequestId: submission.providerRequestId };
  } catch (err) {
    const category = failureCategory(err);
    const message = err instanceof Error ? err.message : String(err);
    await db.update(processingJobs).set({ status: 'failed', errorCode: category, errorMessage: message.slice(0, 500), updatedAt: new Date() }).where(and(eq(processingJobs.id, processingJobId), ne(processingJobs.status, 'completed'))).catch(() => undefined);
    await db.update(meetings).set({ status: 'failed', updatedAt: new Date() }).where(eq(meetings.id, meetingId)).catch(() => undefined);
    log('stt_submission_failed', { processingJobId, meetingId, category, error: message });
    return { ok: false, category };
  } finally {
    await removeTempFile(tempPath);
  }
}

/**
 * Phase 2 — apply a provider callback to a job. IDEMPOTENT: a job already
 * completed returns `duplicate`; a re-delivered callback never duplicates the
 * transcript, speakers, or the AI Pack job. Only persists on a valid result.
 */
export async function applyTranscriptionCallback(
  deps: IngestDeps,
  job: typeof processingJobs.$inferSelect,
  outcome: TranscriptionCallbackOutcome,
): Promise<{ status: 'completed' | 'failed' | 'duplicate'; category?: IngestFailureCategory }> {
  const { db, log } = deps;
  const processingJobId = job.id;
  const meetingId = job.meetingId;
  const workspaceId = job.workspaceId;

  if (job.status === 'completed') {
    log('stt_callback_duplicate', { processingJobId, meetingId });
    return { status: 'duplicate' };
  }

  if (!outcome.ok) {
    await db.update(processingJobs).set({ status: 'failed', errorCode: outcome.category === 'unsupported_media' ? 'permanent' : 'needs_reupload', errorMessage: outcome.message.slice(0, 500), updatedAt: new Date() }).where(eq(processingJobs.id, processingJobId));
    await db.update(meetings).set({ status: 'failed', updatedAt: new Date() }).where(eq(meetings.id, meetingId));
    log('stt_callback_failed', { processingJobId, meetingId, category: outcome.category, error: outcome.message });
    return { status: 'failed', category: outcome.category === 'unsupported_media' ? 'permanent' : 'needs_reupload' };
  }

  const result = outcome.result;
  const { speakers, segments } = segmentTranscription(result.words);
  const detectedLanguage = result.detectedLanguage ?? 'pt-BR';
  const durationMs = result.durationMs ?? (segments.length ? segments[segments.length - 1]!.endMs : 0);

  const aiPackJobId = await db.transaction(async (tx) => {
    // Re-check inside the transaction for concurrent duplicate callbacks.
    const fresh = (await tx.select({ status: processingJobs.status }).from(processingJobs).where(eq(processingJobs.id, processingJobId)).limit(1))[0];
    if (!fresh || fresh.status === 'completed') return null;
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
    await tx.update(processingJobs).set({ status: 'completed', stage: 'ready_for_ai_pack', progress: 100, completedAt: new Date(), errorCode: null, errorMessage: null, provider: result.provider, providerRequestId: result.providerRequestId ?? job.providerRequestId, model: result.model, metrics: { segmentCount: segments.length, wordCount: result.words.length, speakerCount: speakers.length }, updatedAt: new Date() }).where(eq(processingJobs.id, processingJobId));
    const [aiJob] = await tx.insert(processingJobs).values({ workspaceId, meetingId, type: 'ai_pack', status: 'queued', stage: 'ready_for_ai_pack', progress: 0 }).returning();
    return aiJob!.id;
  });

  if (aiPackJobId === null) {
    log('stt_callback_duplicate', { processingJobId, meetingId });
    return { status: 'duplicate' };
  }

  log('transcript_persisted', { processingJobId, meetingId, segmentCount: segments.length, speakerCount: speakers.length });
  await deps.enqueue(aiPackJobId);
  log('ai_pack_enqueued', { processingJobId, meetingId, aiPackJobId });
  return { status: 'completed' };
}

export interface IngestTextInput {
  workspaceId: string;
  ownerId: string;
  title: string;
  meetingLanguage: string;
  /** Already-extracted plain text (txt/docx/notes/link). Non-empty. */
  text: string;
}

/**
 * Ingest already-extracted TEXT (txt/docx/pasted notes/Plaud transcript/a link).
 * There is no transcription: the text IS the transcript, so we create the meeting
 * in the same post-transcript state the audio path reaches (`status: 'ready'`,
 * `aiPackStatus: 'queued'`), split the text into transcript segments, insert the
 * `ai_pack` job, and enqueue it. The AI Pack runner reads the segments from the
 * DB by meetingId and generates identically to the audio path.
 */
export async function ingestText(
  db: Database,
  enqueue: (processingJobId: string) => Promise<void>,
  input: IngestTextInput,
): Promise<{ meetingId: string; processingJobId: string }> {
  // One transcript segment per paragraph (keeps AI Pack chunking natural),
  // falling back to a single segment when there are no blank-line breaks.
  const paragraphs = input.text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.replace(/[ \t]+/g, ' ').trim())
    .filter((p) => p.length > 0);
  const chunks = paragraphs.length > 0 ? paragraphs : [input.text.trim()];

  const created = await db.transaction(async (tx) => {
    const [meeting] = await tx
      .insert(meetings)
      .values({
        workspaceId: input.workspaceId,
        ownerId: input.ownerId,
        title: input.title,
        source: 'text',
        status: 'ready',
        meetingLanguage: input.meetingLanguage,
        durationSeconds: 0,
        participantCount: 1,
        aiPackStatus: 'queued',
      })
      .returning();

    await tx.insert(transcriptSegments).values(
      chunks.map((text, i) => ({
        workspaceId: input.workspaceId,
        meetingId: meeting!.id,
        speakerKey: 'speaker_0',
        orderIndex: i,
        sequence: i,
        startSeconds: 0,
        endSeconds: 0,
        text,
        language: input.meetingLanguage,
      })),
    );

    const [aiJob] = await tx
      .insert(processingJobs)
      .values({ workspaceId: input.workspaceId, meetingId: meeting!.id, type: 'ai_pack', status: 'queued', stage: 'ready_for_ai_pack', progress: 0 })
      .returning();

    return { meetingId: meeting!.id, processingJobId: aiJob!.id };
  });

  await enqueue(created.processingJobId);
  return created;
}
