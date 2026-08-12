import { eq } from 'drizzle-orm';
import { createDb } from './client';
import {
  accessRequests,
  aiPacks,
  auditEvents,
  exportPresets,
  invitations,
  meetings,
  processingJobs,
  sessions,
  transcriptSegments,
  userSettings,
  users,
  workspaces,
} from './schema';
import { loadEnv } from '../env';
import { hashPassword, hashToken } from '../lib/crypto';
import { defaultSettings } from '../services/defaults';

const ATLAS_SEGMENTS = [
  { key: 'm1_sp1', s: 252, e: 268, t: 'A ideia é começar o piloto com uma unidade de negócio só.' },
  { key: 'm1_sp2', s: 696, e: 712, t: 'Precisamos entender o esforço da integração antes de assumir qualquer data.' },
  { key: 'm1_sp2', s: 1122, e: 1140, t: 'Sem a integração, não acho que a gente consiga rodar o piloto direito.' },
  { key: 'm1_sp3', s: 1445, e: 1462, t: 'O time de engenharia estimou três semanas, mas isso ainda não está fechado.' },
  { key: 'm1_sp3', s: 1938, e: 1952, t: 'Então outubro provavelmente é uma data mais realista.' },
  { key: 'm1_sp4', s: 2210, e: 2226, t: 'O faturamento anual entra na proposta ou fica separado?' },
];

const ATLAS_PACK = [
  { key: 'metadata', confidence: 'explicit', lines: [{ pt: 'Reunião comercial com Atlas · 42:18 · Português (Brasil) · Gravação no navegador', en: 'Commercial meeting with Atlas · 42:18 · Portuguese (Brazil) · Browser recording' }] },
  { key: 'participants', confidence: 'explicit', lines: [{ text: 'Rafael Martins — Northstar' }, { text: 'João Silva — Atlas' }] },
  { key: 'purpose', confidence: 'inferred', lines: [{ pt: 'Discutir escopo do piloto, requisitos de integração e condições comerciais.', en: 'Discuss pilot scope, integration requirements and commercial conditions.' }] },
  { key: 'topics', confidence: 'explicit', lines: [{ pt: 'Escopo do piloto · 04:12', en: 'Pilot scope · 04:12', atSeconds: 252 }] },
  { key: 'importantStatements', confidence: 'explicit', lines: [{ text: 'João Silva: “Sem a integração, não acho que a gente consiga rodar o piloto direito.”', atSeconds: 1122 }] },
  { key: 'explicitDecisions', confidence: 'explicit', lines: [{ pt: 'O piloto começa com uma unidade de negócio.', en: 'The pilot will start with one business unit.' }] },
  { key: 'openPoints', confidence: 'explicit', lines: [{ pt: 'Escopo final da integração continua indefinido.', en: 'Final integration scope remains undefined.' }] },
  { key: 'numbersAndDates', confidence: 'explicit', lines: [{ text: 'R$ 120.000' }, { pt: 'Outubro de 2026', en: 'October 2026' }] },
  { key: 'ambiguities', confidence: 'uncertain', lines: [{ pt: 'A data final de lançamento foi discutida, mas não confirmada formalmente.', en: 'The final launch date was discussed but not formally confirmed.' }] },
];

export async function seed(databaseUrl: string): Promise<void> {
  const { db, close } = createDb(databaseUrl, { max: 1 });
  try {
    // Dev/test seed only — clear existing rows (respecting FKs).
    await db.delete(auditEvents);
    await db.delete(transcriptSegments);
    await db.delete(aiPacks);
    await db.delete(processingJobs);
    await db.delete(exportPresets);
    await db.delete(meetings);
    await db.delete(invitations);
    await db.delete(accessRequests);
    await db.delete(userSettings);
    await db.delete(sessions);
    await db.delete(users);
    await db.delete(workspaces);

    const [ws] = await db.insert(workspaces).values({ name: 'Apymine', slug: 'apymine', plan: 'pro', seats: 10 }).returning();
    const passwordHash = await hashPassword('password123');
    const [owner] = await db
      .insert(users)
      .values({ email: 'vinicius@apymine.com', name: 'Vinícius', role: 'owner', status: 'active', workspaceId: ws!.id, locale: 'pt-BR', passwordHash, activatedAt: new Date() })
      .returning();
    await db.update(workspaces).set({ ownerUserId: owner!.id }).where(eq(workspaces.id, ws!.id));

    const s = defaultSettings(owner!.id);
    await db.insert(userSettings).values({ userId: owner!.id, general: { ...s.general, displayName: 'Vinícius' }, recording: s.recording, export: s.export, language: s.language, privacy: s.privacy, appearance: s.appearance });

    await db.insert(accessRequests).values([
      { name: 'João Pereira', email: 'joao@startup.io', company: 'Startup.io', role: 'Head of Product', useCase: 'Organizar reuniões de discovery em contexto para IA.', preferredLocale: 'pt-BR', status: 'submitted' },
      { name: 'Emily Carter', email: 'emily@northwind.com', company: 'Northwind', role: 'Ops Manager', useCase: 'Summarize weekly ops meetings for the leadership team.', preferredLocale: 'en-US', status: 'submitted' },
    ]);

    await db.insert(invitations).values({ email: 'rafael@acme.com', workspaceId: ws!.id, role: 'member', tokenHash: hashToken('welcome-rafael'), status: 'pending', invitedByUserId: owner!.id, expiresAt: new Date(Date.now() + 14 * 864e5) });

    const [atlas] = await db
      .insert(meetings)
      .values({ workspaceId: ws!.id, ownerId: owner!.id, title: 'Reunião comercial com Atlas', source: 'recording', status: 'ready', meetingLanguage: 'pt-BR', durationSeconds: 2538, participantCount: 4, summaryLine: 'Piloto com uma unidade, integração a validar.', recordingAudioRef: 'mock-audio://2538s', waveformPeaks: [0.3, 0.6, 0.8, 0.5, 0.9], speakerAliases: { m1_sp1: 'Rafael Martins', m1_sp2: 'João Silva', m1_sp3: 'Marina Costa', m1_sp4: 'Fernanda Rocha' } })
      .returning();
    await db.insert(transcriptSegments).values(ATLAS_SEGMENTS.map((seg, i) => ({ meetingId: atlas!.id, speakerKey: seg.key, orderIndex: i, startSeconds: seg.s, endSeconds: seg.e, text: seg.t, language: 'pt-BR' })));
    await db.insert(aiPacks).values({ meetingId: atlas!.id, model: 'demo', sourceSections: ATLAS_PACK });
    await db.insert(processingJobs).values({ workspaceId: ws!.id, meetingId: atlas!.id, type: 'ai_pack', status: 'completed', stage: 'ready', progress: 100, completedAt: new Date() });

    const [proc] = await db.insert(meetings).values({ workspaceId: ws!.id, ownerId: owner!.id, title: 'Revisão de produto Q3', source: 'recording', status: 'processing', meetingLanguage: 'pt-BR', durationSeconds: 3484, participantCount: 3, summaryLine: 'Processando…' }).returning();
    await db.insert(processingJobs).values({ workspaceId: ws!.id, meetingId: proc!.id, type: 'transcription', status: 'running', stage: 'transcribing', progress: 33, startedAt: new Date() });

    const [failed] = await db.insert(meetings).values({ workspaceId: ws!.id, ownerId: owner!.id, title: 'Entrevista Product Designer', source: 'upload', status: 'failed', meetingLanguage: 'pt-BR', durationSeconds: 3082, participantCount: 2, summaryLine: 'Falha no processamento.' }).returning();
    await db.insert(processingJobs).values({ workspaceId: ws!.id, meetingId: failed!.id, type: 'media_processing', status: 'failed', stage: 'preparing_audio', progress: 12, attempt: 3, errorCode: 'AUDIO_CORRUPT', errorMessage: 'The uploaded file could not be decoded.', startedAt: new Date() });

    // eslint-disable-next-line no-console
    console.log('seed complete');
  } finally {
    await close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const env = loadEnv();
  seed(env.DATABASE_URL)
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('seed failed', err);
      process.exit(1);
    });
}
