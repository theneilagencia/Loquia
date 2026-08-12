import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { exportPresets } from '../db/schema';
import { requireAuth, assertWorkspace } from '../context';
import { errors } from '../lib/errors';

function toPresetDTO(row: typeof exportPresets.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    basePreset: row.basePreset,
    size: row.size,
    format: row.format,
    sections: row.sections,
    includeTimestamps: row.includeTimestamps,
    includeSpeakers: row.includeSpeakers,
    isDefault: row.isDefault,
  };
}

const sectionsSchema = z.object({
  instructions: z.boolean(),
  transcript: z.boolean(),
  evidence: z.boolean(),
  ambiguities: z.boolean(),
});

const upsertSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  basePreset: z.string(),
  size: z.enum(['compact', 'standard', 'full']),
  format: z.enum(['md', 'txt', 'json']),
  sections: sectionsSchema,
  includeTimestamps: z.boolean().default(true),
  includeSpeakers: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export async function registerPresetRoutes(app: FastifyInstance): Promise<void> {
  const { db } = app.ctx;

  app.get('/', async (request) => {
    const auth = requireAuth(request.auth);
    const rows = await db.select().from(exportPresets).where(eq(exportPresets.workspaceId, auth.user.workspaceId));
    return rows.map(toPresetDTO);
  });

  app.post('/', async (request) => {
    const auth = requireAuth(request.auth);
    const input = upsertSchema.parse(request.body);
    const rows = await db
      .insert(exportPresets)
      .values({ ...input, basePreset: input.basePreset as never, workspaceId: auth.user.workspaceId, userId: auth.user.id })
      .returning();
    return toPresetDTO(rows[0]!);
  });

  app.patch('/:id', async (request) => {
    const auth = requireAuth(request.auth);
    const { id } = request.params as { id: string };
    const existing = await db.select().from(exportPresets).where(eq(exportPresets.id, id)).limit(1);
    if (!existing[0]) throw errors.notFound();
    assertWorkspace(auth, existing[0].workspaceId);
    const input = upsertSchema.partial().parse(request.body);
    const rows = await db.update(exportPresets).set({ ...input, basePreset: input.basePreset as never }).where(eq(exportPresets.id, id)).returning();
    return toPresetDTO(rows[0]!);
  });

  app.delete('/:id', async (request) => {
    const auth = requireAuth(request.auth);
    const { id } = request.params as { id: string };
    const existing = await db.select().from(exportPresets).where(eq(exportPresets.id, id)).limit(1);
    if (!existing[0]) throw errors.notFound();
    assertWorkspace(auth, existing[0].workspaceId);
    await db.delete(exportPresets).where(eq(exportPresets.id, id));
    return { ok: true };
  });

  app.post('/:id/default', async (request) => {
    const auth = requireAuth(request.auth);
    const { id } = request.params as { id: string };
    const existing = await db.select().from(exportPresets).where(eq(exportPresets.id, id)).limit(1);
    if (!existing[0]) throw errors.notFound();
    assertWorkspace(auth, existing[0].workspaceId);
    await db.transaction(async (tx) => {
      await tx.update(exportPresets).set({ isDefault: false }).where(eq(exportPresets.workspaceId, auth.user.workspaceId));
      await tx.update(exportPresets).set({ isDefault: true }).where(and(eq(exportPresets.id, id), eq(exportPresets.workspaceId, auth.user.workspaceId)));
    });
    return { ok: true };
  });
}
