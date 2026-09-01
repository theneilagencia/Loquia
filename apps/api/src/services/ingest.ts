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

interface ParsedSegment {
  speakerKey: string;
  startSeconds: number;
  text: string;
}

/** "HH:MM:SS" or "MM:SS" → seconds. */
function timestampToSeconds(ts: string): number {
  const parts = ts.split(':').map((n) => Number(n));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  return 0;
}

const TIMESTAMP_RE = /^(\d{1,2}:\d{2}(?::\d{2})?)$/;
/** A standalone diarization label line: "Speaker 1", "Falante 2", "Locutor 3". */
const SPEAKER_LABEL_RE = /^(?:speaker|falante|locutor|orador)\s*[#]?\s*(\w{1,20})$/i;
/**
 * Inline speaker prefix at the start of a paragraph. Deliberately conservative —
 * only a diarization keyword label ("Speaker 1:", "Falante 2:") or a SINGLE
 * capitalized name token ("Paulo:", "Vinícius:"). Matching multi-word phrases
 * here caused ordinary sentences that contain a colon (e.g. "Ficou decidido:")
 * to be mistaken for speakers, so that is intentionally NOT matched.
 */
const INLINE_KEYWORD_RE = /^((?:speaker|falante|locutor|orador)\s*#?\s*\w{1,20})\s*:\s+/i;
const INLINE_NAME_RE = /^(\p{Lu}[\p{Ll}'-]{1,19})\s*:\s+/u;

/**
 * Parse a speaker-labeled transcript (Plaud / Otter / Zoom exports) into
 * per-utterance segments, preserving WHO spoke and WHEN. Returns null when the
 * text has no recognizable speaker structure (then we fall back to paragraphs).
 *
 * Two shapes are recognized:
 *  - block form: a timestamp line and/or a standalone "Speaker N" line, then the
 *    utterance text on the following line(s) (Plaud export — the common case);
 *  - inline form: paragraphs that start with "Speaker N:" or "Name:".
 */
export function parseSpeakerTranscript(
  raw: string,
): { segments: ParsedSegment[]; aliases: Record<string, string>; speakerCount: number } | null {
  // Normalize each line, and strip trailing backslashes — RTF exports converted
  // client-side can leave a "\" line-continuation at each line end, which would
  // otherwise stop "Speaker N" / timestamp lines from matching.
  const lines = raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\\+\s*$/, '').trim());
  const labelToKey = new Map<string, string>();
  const aliases: Record<string, string> = {};
  const keyFor = (label: string): string => {
    const norm = label.trim();
    let key = labelToKey.get(norm);
    if (!key) {
      key = `speaker_${labelToKey.size}`;
      labelToKey.set(norm, key);
      aliases[key] = norm;
    }
    return key;
  };

  const segments: ParsedSegment[] = [];
  let curSpeaker: string | null = null;
  let curStart = 0;
  let pendingStart = 0;
  let buffer: string[] = [];
  const flush = () => {
    const text = buffer.join(' ').replace(/[ \t]+/g, ' ').trim();
    if (curSpeaker && text) segments.push({ speakerKey: keyFor(curSpeaker), startSeconds: curStart, text });
    buffer = [];
  };

  let sawLabel = false;
  for (const line of lines) {
    if (!line) continue;
    const ts = line.match(TIMESTAMP_RE);
    if (ts) {
      pendingStart = timestampToSeconds(ts[1]!);
      continue;
    }
    const label = line.match(SPEAKER_LABEL_RE);
    if (label) {
      flush();
      curSpeaker = line;
      curStart = pendingStart;
      sawLabel = true;
      continue;
    }
    const inline = line.match(INLINE_KEYWORD_RE) ?? line.match(INLINE_NAME_RE);
    if (inline) {
      flush();
      curSpeaker = inline[1]!.trim();
      curStart = pendingStart;
      buffer.push(line.slice(inline[0].length));
      sawLabel = true;
      continue;
    }
    // Utterance text; if no speaker seen yet, keep it under a default speaker.
    if (!curSpeaker) curSpeaker = 'Speaker 1';
    buffer.push(line);
  }
  flush();

  // Only treat it as a real transcript if we actually found labels and >1 speaker
  // (otherwise the paragraph fallback is just as good and simpler).
  if (!sawLabel || segments.length === 0 || labelToKey.size < 2) return null;
  return { segments, aliases, speakerCount: labelToKey.size };
}

/**
 * Ingest already-extracted TEXT (txt/docx/pasted notes/Plaud transcript/a link).
 * There is no transcription: the text IS the transcript, so we create the meeting
 * in the same post-transcript state the audio path reaches (`status: 'ready'`,
 * `aiPackStatus: 'queued'`), split the text into transcript segments, insert the
 * `ai_pack` job, and enqueue it. The AI Pack runner reads the segments from the
 * DB by meetingId and generates identically to the audio path.
 *
 * When the text is a speaker-labeled transcript (Plaud/Otter/Zoom), the speaker
 * and timestamp of each utterance are preserved so the AI Pack can attribute who
 * said what — otherwise the whole thing collapsed onto a single speaker and the
 * pack lost all attribution.
 */
export async function ingestText(
  db: Database,
  enqueue: (processingJobId: string) => Promise<void>,
  input: IngestTextInput,
): Promise<{ meetingId: string; processingJobId: string }> {
  const parsed = parseSpeakerTranscript(input.text);

  // Fallback (no speaker structure): one segment per paragraph, single speaker.
  const paragraphs = input.text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.replace(/[ \t]+/g, ' ').trim())
    .filter((p) => p.length > 0);
  const fallbackChunks = paragraphs.length > 0 ? paragraphs : [input.text.trim()];

  const rows = parsed
    ? parsed.segments.map((s, i) => ({ speakerKey: s.speakerKey, startSeconds: s.startSeconds, text: s.text, orderIndex: i, sequence: i }))
    : fallbackChunks.map((text, i) => ({ speakerKey: 'speaker_0', startSeconds: 0, text, orderIndex: i, sequence: i }));

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
        durationSeconds: parsed ? parsed.segments[parsed.segments.length - 1]!.startSeconds : 0,
        participantCount: parsed ? parsed.speakerCount : 1,
        speakerAliases: parsed ? parsed.aliases : {},
        aiPackStatus: 'queued',
      })
      .returning();

    await tx.insert(transcriptSegments).values(
      rows.map((r) => ({
        workspaceId: input.workspaceId,
        meetingId: meeting!.id,
        speakerKey: r.speakerKey,
        orderIndex: r.orderIndex,
        sequence: r.sequence,
        startSeconds: r.startSeconds,
        endSeconds: r.startSeconds,
        text: r.text,
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
