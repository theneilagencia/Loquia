import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { nextStage, stageProgress } from '@loquia/domain';
import {
  aiPacks,
  exportHistory,
  markers,
  meetings,
  processingJobs,
  transcriptSegments,
} from '../db/schema';
import { toMeetingDTO, toProcessingJobDTO } from '../dto';
import { requireAuth, assertWorkspace } from '../context';
import { errors } from '../lib/errors';
import { generateDemo, SPEAKER_PALETTE } from '../services/demo';

async function loadOwnedMeeting(app: FastifyInstance, auth: ReturnType<typeof requireAuth>, id: string) {
  const rows = await app.ctx.db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  const meeting = rows[0];
  if (!meeting) throw errors.notFound();
  assertWorkspace(auth, meeting.workspaceId); // workspace isolation
  return meeting;
}

export async function registerMeetingRoutes(app: FastifyInstance): Promise<void> {
  const { db } = app.ctx;

  app.get('/', async (request) => {
    const auth = requireAuth(request.auth);
    const { includeArchived } = z
      .object({ includeArchived: z.coerce.boolean().default(false) })
      .parse(request.query);
    const rows = await db
      .select()
      .from(meetings)
      .where(
        includeArchived
          ? eq(meetings.workspaceId, auth.user.workspaceId)
          : and(eq(meetings.workspaceId, auth.user.workspaceId), ne(meetings.status, 'archived')),
      )
      .orderBy(desc(meetings.createdAt));
    return rows.map(toMeetingDTO);
  });

  app.get('/:id', async (request) => {
    const auth = requireAuth(request.auth);
    return toMeetingDTO(await loadOwnedMeeting(app, auth, (request.params as { id: string }).id));
  });

  const createSchema = z.object({
    title: z.string().min(1),
    source: z.enum(['recording', 'upload']),
    meetingLanguage: z.string().default('pt-BR'),
    durationSeconds: z.number().int().nonnegative().default(0),
    recording: z
      .object({ durationSeconds: z.number(), audioRef: z.string(), waveformPeaks: z.array(z.number()) })
      .optional(),
  });

  app.post('/', async (request) => {
    const auth = requireAuth(request.auth);
    const input = createSchema.parse(request.body);
    const inserted = await db
      .insert(meetings)
      .values({
        workspaceId: auth.user.workspaceId,
        ownerId: auth.user.id,
        title: input.title,
        source: input.source,
        status: 'processing',
        meetingLanguage: input.meetingLanguage,
        durationSeconds: input.durationSeconds,
        participantCount: 0,
        recordingAudioRef: input.recording?.audioRef,
        waveformPeaks: input.recording?.waveformPeaks,
      })
      .returning();
    const meeting = inserted[0]!;
    await db.insert(processingJobs).values({
      workspaceId: auth.user.workspaceId,
      meetingId: meeting.id,
      type: 'media_processing',
      status: 'queued',
      stage: 'received',
      progress: 0,
    });
    return toMeetingDTO(meeting);
  });

  app.patch('/:id', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    const { title } = z.object({ title: z.string().min(1) }).parse(request.body);
    const rows = await db.update(meetings).set({ title, updatedAt: new Date() }).where(eq(meetings.id, meeting.id)).returning();
    return toMeetingDTO(rows[0]!);
  });

  app.post('/:id/archive', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    const rows = await db.update(meetings).set({ status: 'archived', archivedAt: new Date(), updatedAt: new Date() }).where(eq(meetings.id, meeting.id)).returning();
    return toMeetingDTO(rows[0]!);
  });

  app.post('/:id/unarchive', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    const hasPack = await db.select({ n: sql<number>`count(*)::int` }).from(aiPacks).where(eq(aiPacks.meetingId, meeting.id));
    const status = (hasPack[0]?.n ?? 0) > 0 ? 'ready' : 'draft';
    const rows = await db.update(meetings).set({ status, archivedAt: null, updatedAt: new Date() }).where(eq(meetings.id, meeting.id)).returning();
    return toMeetingDTO(rows[0]!);
  });

  // ---- Processing job (demo pipeline; no real STT) ----
  app.get('/:id/job', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    const rows = await db.select().from(processingJobs).where(eq(processingJobs.meetingId, meeting.id)).orderBy(desc(processingJobs.createdAt)).limit(1);
    return rows[0] ? toProcessingJobDTO(rows[0]) : null;
  });

  app.post('/:id/job/tick', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    const jobRows = await db.select().from(processingJobs).where(eq(processingJobs.meetingId, meeting.id)).orderBy(desc(processingJobs.createdAt)).limit(1);
    const job = jobRows[0];
    if (!job) return null;
    if (job.status === 'completed' || job.status === 'failed') return toProcessingJobDTO(job);

    const upcoming = nextStage(job.stage);
    const now = new Date();
    const updated = await db.transaction(async (tx) => {
      let patch: Partial<typeof processingJobs.$inferInsert> = { status: 'running', startedAt: job.startedAt ?? now, updatedAt: now };
      if (upcoming) {
        patch = { ...patch, stage: upcoming, progress: stageProgress(upcoming) };
        if (upcoming === 'ready_for_ai_pack') {
          patch = { ...patch, status: 'completed', progress: 100, completedAt: now };
          await tx.update(meetings).set({ status: 'ready', updatedAt: now }).where(eq(meetings.id, meeting.id));
          const existing = await tx.select({ n: sql<number>`count(*)::int` }).from(transcriptSegments).where(eq(transcriptSegments.meetingId, meeting.id));
          if ((existing[0]?.n ?? 0) === 0) {
            const demo = generateDemo(meeting.id, meeting.meetingLanguage);
            await tx.insert(transcriptSegments).values(demo.segments.map((s) => ({ ...s, meetingId: meeting.id })));
            await tx.insert(aiPacks).values({ meetingId: meeting.id, model: 'demo', sourceSections: demo.sourceSections });
            await tx.update(meetings).set({ speakerAliases: demo.speakerAliases, participantCount: 2 }).where(eq(meetings.id, meeting.id));
          }
        }
      }
      const rows = await tx.update(processingJobs).set(patch).where(eq(processingJobs.id, job.id)).returning();
      return rows[0]!;
    });
    return toProcessingJobDTO(updated);
  });

  app.post('/:id/job/retry', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    const jobRows = await db.select().from(processingJobs).where(eq(processingJobs.meetingId, meeting.id)).orderBy(desc(processingJobs.createdAt)).limit(1);
    if (!jobRows[0]) throw errors.notFound();
    const rows = await db.update(processingJobs).set({ status: 'queued', stage: 'received', progress: 0, attempt: 1, errorCode: null, errorMessage: null, startedAt: null, completedAt: null, updatedAt: new Date() }).where(eq(processingJobs.id, jobRows[0].id)).returning();
    await db.update(meetings).set({ status: 'processing', updatedAt: new Date() }).where(eq(meetings.id, meeting.id));
    return toProcessingJobDTO(rows[0]!);
  });

  // ---- Transcript (demo content, real persistence of edits/renames) ----
  app.get('/:id/transcript', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    return buildTranscript(app, meeting);
  });

  app.get('/:id/transcript/search', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    const { q } = z.object({ q: z.string().default('') }).parse(request.query);
    const t = await buildTranscript(app, meeting);
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    return t.segments.filter((s) => s.text.toLowerCase().includes(needle));
  });

  app.patch('/:id/segments/:segmentId', async (request) => {
    const auth = requireAuth(request.auth);
    const { id, segmentId } = request.params as { id: string; segmentId: string };
    const meeting = await loadOwnedMeeting(app, auth, id);
    const { text } = z.object({ text: z.string() }).parse(request.body);
    const rows = await db.update(transcriptSegments).set({ text, edited: true }).where(and(eq(transcriptSegments.id, segmentId), eq(transcriptSegments.meetingId, meeting.id))).returning();
    if (!rows[0]) throw errors.notFound();
    const seg = rows[0];
    return { id: seg.id, speakerId: seg.speakerKey, startSeconds: seg.startSeconds, endSeconds: seg.endSeconds, text: seg.text, edited: seg.edited, language: seg.language };
  });

  app.post('/:id/speakers/:speakerId/rename', async (request) => {
    const auth = requireAuth(request.auth);
    const { id, speakerId } = request.params as { id: string; speakerId: string };
    const meeting = await loadOwnedMeeting(app, auth, id);
    const { displayName } = z.object({ displayName: z.string() }).parse(request.body);
    const aliases = { ...(meeting.speakerAliases ?? {}) };
    if (displayName.trim()) aliases[speakerId] = displayName.trim();
    else delete aliases[speakerId];
    await db.update(meetings).set({ speakerAliases: aliases, updatedAt: new Date() }).where(eq(meetings.id, meeting.id));
    return { id: speakerId, displayName: displayName.trim() || undefined };
  });

  app.post('/:id/markers', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    const input = z.object({ atSeconds: z.number(), label: z.string(), kind: z.enum(['user', 'auto']).default('user') }).parse(request.body);
    const rows = await db.insert(markers).values({ meetingId: meeting.id, atSeconds: input.atSeconds, label: input.label, kind: input.kind }).returning();
    const m = rows[0]!;
    return { id: m.id, atSeconds: m.atSeconds, label: m.label, kind: m.kind, createdAt: new Date(m.createdAt).toISOString() };
  });

  // ---- AI Pack (raw bilingual source; resolved by the shared engine client-side) ----
  app.get('/:id/aipack', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    const rows = await db.select().from(aiPacks).where(eq(aiPacks.meetingId, meeting.id)).limit(1);
    if (!rows[0]) return { source: null };
    return { source: { meetingId: meeting.id, sections: rows[0].sourceSections } };
  });

  // ---- Export history (server-side persistence) ----
  app.get('/:id/exports', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    const rows = await db.select().from(exportHistory).where(eq(exportHistory.meetingId, meeting.id)).orderBy(desc(exportHistory.at));
    return rows.map((r) => ({
      id: r.id, meetingId: r.meetingId, meetingTitle: r.meetingTitle, at: new Date(r.at).toISOString(),
      action: r.action, preset: r.preset, size: r.size, format: r.format, language: r.language, filename: r.filename ?? undefined, bytes: r.bytes,
    }));
  });

  app.post('/:id/exports', async (request) => {
    const auth = requireAuth(request.auth);
    const meeting = await loadOwnedMeeting(app, auth, (request.params as { id: string }).id);
    const input = z.object({ action: z.enum(['copied', 'downloaded']), preset: z.string(), size: z.string(), format: z.string(), language: z.string(), filename: z.string().optional(), bytes: z.number().default(0) }).parse(request.body);
    await db.insert(exportHistory).values({
      meetingId: meeting.id, workspaceId: meeting.workspaceId, userId: auth.user.id, meetingTitle: meeting.title,
      action: input.action, preset: input.preset, size: input.size as never, format: input.format as never, language: input.language, filename: input.filename, bytes: input.bytes,
    });
    return { ok: true };
  });
}

async function buildTranscript(app: FastifyInstance, meeting: typeof meetings.$inferSelect) {
  const segs = await app.ctx.db
    .select()
    .from(transcriptSegments)
    .where(eq(transcriptSegments.meetingId, meeting.id))
    .orderBy(asc(transcriptSegments.orderIndex));
  const aliases = meeting.speakerAliases ?? {};
  const keys = [...new Set(segs.map((s) => s.speakerKey))];
  const speakers = keys.map((key, i) => ({
    id: key,
    diarizationLabel: `Speaker ${i + 1}`,
    displayName: aliases[key],
    color: SPEAKER_PALETTE[i % SPEAKER_PALETTE.length]!,
  }));
  return {
    meetingId: meeting.id,
    language: meeting.meetingLanguage,
    updatedAt: new Date(meeting.updatedAt).toISOString(),
    speakers,
    segments: segs.map((s) => ({
      id: s.id,
      speakerId: s.speakerKey,
      startSeconds: s.startSeconds,
      endSeconds: s.endSeconds,
      text: s.text,
      edited: s.edited,
      language: s.language,
    })),
  };
}
