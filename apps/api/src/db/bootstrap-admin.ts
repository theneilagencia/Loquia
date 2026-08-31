import { eq } from 'drizzle-orm';
import { createDb } from './client';
import { userSettings, users, workspaces } from './schema';
import { loadEnv } from '../env';
import { hashPassword } from '../lib/crypto';
import { defaultSettings } from '../services/defaults';

export interface AdminSeed {
  email: string;
  password: string;
  name: string;
  locale: string;
}

/**
 * Idempotent, NON-destructive first-admin bootstrap. Unlike `seed()` (which
 * wipes the database and is dev/test only), this creates the initial owner
 * workspace + user ONLY when the users table is empty. On a database that
 * already has any user it is a no-op, so it is safe to run on every deploy
 * (before `start`). This is what makes the admin login usable in production.
 */
export async function bootstrapAdmin(databaseUrl: string, admin: AdminSeed): Promise<'created' | 'skipped'> {
  const { db, close } = createDb(databaseUrl, { max: 1 });
  try {
    const existing = await db.select({ id: users.id }).from(users).limit(1);
    if (existing.length > 0) {
      // eslint-disable-next-line no-console
      console.log('bootstrap-admin: users already exist — skipping');
      return 'skipped';
    }

    const passwordHash = await hashPassword(admin.password);
    const [ws] = await db
      .insert(workspaces)
      .values({ name: 'Apymine', slug: 'apymine', plan: 'pro', seats: 10 })
      .returning();
    const [owner] = await db
      .insert(users)
      .values({
        email: admin.email,
        name: admin.name,
        role: 'owner',
        status: 'active',
        workspaceId: ws!.id,
        locale: admin.locale,
        passwordHash,
        activatedAt: new Date(),
      })
      .returning();
    await db.update(workspaces).set({ ownerUserId: owner!.id }).where(eq(workspaces.id, ws!.id));

    const s = defaultSettings(owner!.id, admin.locale);
    await db.insert(userSettings).values({
      userId: owner!.id,
      general: { ...s.general, displayName: admin.name },
      recording: s.recording,
      export: s.export,
      language: s.language,
      privacy: s.privacy,
      appearance: s.appearance,
    });

    // eslint-disable-next-line no-console
    console.log(`bootstrap-admin: created owner ${admin.email}`);
    return 'created';
  } finally {
    await close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const env = loadEnv();
  const email = process.env.ADMIN_EMAIL ?? 'vinicius@apymine.com';
  const password = process.env.ADMIN_PASSWORD ?? 'password123';
  const name = process.env.ADMIN_NAME ?? 'Vinícius';
  const locale = process.env.ADMIN_LOCALE ?? 'pt-BR';
  if (!process.env.ADMIN_PASSWORD) {
    // eslint-disable-next-line no-console
    console.warn(
      'bootstrap-admin: ADMIN_PASSWORD not set — using the default. Set ADMIN_PASSWORD in the environment and rotate the credential.',
    );
  }
  bootstrapAdmin(env.DATABASE_URL, { email, password, name, locale })
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('bootstrap-admin failed', err);
      process.exit(1);
    });
}
