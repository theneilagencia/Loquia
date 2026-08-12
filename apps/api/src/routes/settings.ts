import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { userSettings } from '../db/schema';
import { toSettingsDTO } from '../dto';
import { requireAuth } from '../context';
import { defaultSettings } from '../services/defaults';

function deepMerge<T>(base: T, patch: unknown): T {
  if (patch == null || typeof patch !== 'object') return base;
  const out = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    const bv = out[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && bv && typeof bv === 'object') {
      out[k] = deepMerge(bv, v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

export async function registerSettingsRoutes(app: FastifyInstance): Promise<void> {
  const { db } = app.ctx;

  async function ensure(userId: string, locale: string) {
    const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    if (rows[0]) return rows[0];
    const s = defaultSettings(userId, locale);
    const inserted = await db
      .insert(userSettings)
      .values({ userId, general: s.general, recording: s.recording, export: s.export, language: s.language, privacy: s.privacy, appearance: s.appearance })
      .returning();
    return inserted[0]!;
  }

  app.get('/', async (request) => {
    const auth = requireAuth(request.auth);
    return toSettingsDTO(await ensure(auth.user.id, auth.user.locale));
  });

  app.patch('/', async (request) => {
    const auth = requireAuth(request.auth);
    const current = toSettingsDTO(await ensure(auth.user.id, auth.user.locale));
    const merged = deepMerge(current, request.body);
    const rows = await db
      .update(userSettings)
      .set({ general: merged.general, recording: merged.recording, export: merged.export, language: merged.language, privacy: merged.privacy, appearance: merged.appearance, updatedAt: new Date() })
      .where(eq(userSettings.userId, auth.user.id))
      .returning();
    return toSettingsDTO(rows[0]!);
  });
}
