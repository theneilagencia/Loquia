import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { meetings, processingJobs } from '../db/schema';
import { toProcessingJobDTO } from '../dto';
import { requireAuth, assertWorkspace } from '../context';
import { errors } from '../lib/errors';

/**
 * ProcessingJob endpoints for internal/testing use (task §21). No real pipeline
 * runs in Milestone 2 — jobs are created/listed/updated only.
 */
export async function registerJobRoutes(app: FastifyInstance): Promise<void> {
  const { db } = app.ctx;

  app.get('/', async (request) => {
    const auth = requireAuth(request.auth);
    const rows = await db
      .select()
      .from(processingJobs)
      .where(eq(processingJobs.workspaceId, auth.user.workspaceId))
      .orderBy(desc(processingJobs.createdAt));
    return rows.map(toProcessingJobDTO);
  });

  app.post('/', async (request) => {
    const auth = requireAuth(request.auth);
    const input = z
      .object({
        meetingId: z.string(),
        type: z.enum(['media_processing', 'transcription', 'diarization', 'ai_pack', 'translation', 'export']),
      })
      .parse(request.body);
    const meeting = await db.select().from(meetings).where(eq(meetings.id, input.meetingId)).limit(1);
    if (!meeting[0]) throw errors.notFound();
    assertWorkspace(auth, meeting[0].workspaceId);
    const rows = await db
      .insert(processingJobs)
      .values({ workspaceId: auth.user.workspaceId, meetingId: input.meetingId, type: input.type, status: 'queued', stage: 'received', progress: 0 })
      .returning();
    return toProcessingJobDTO(rows[0]!);
  });

  app.patch('/:id', async (request) => {
    const auth = requireAuth(request.auth);
    const { id } = request.params as { id: string };
    const input = z
      .object({
        status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']).optional(),
        progress: z.number().int().min(0).max(100).optional(),
        errorCode: z.string().optional(),
        errorMessage: z.string().optional(),
      })
      .parse(request.body);
    const existing = await db.select().from(processingJobs).where(eq(processingJobs.id, id)).limit(1);
    if (!existing[0]) throw errors.notFound();
    assertWorkspace(auth, existing[0].workspaceId);
    const rows = await db.update(processingJobs).set({ ...input, updatedAt: new Date() }).where(eq(processingJobs.id, id)).returning();
    return toProcessingJobDTO(rows[0]!);
  });
}
