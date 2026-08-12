import type {
  AccessRequest,
  AuditEvent,
  ExportHistoryEntry,
  Invitation,
  Marker,
  Meeting,
  OnboardingState,
  ProcessingJob,
  Recording,
  Settings,
  Transcript,
  User,
  Workspace,
} from '@loquia/domain';
import type { PackSource } from './pack-source';

/** A marker with its owning meeting (markers live outside Transcript). */
export type StoredMarker = Marker & { meetingId: string };

export interface MockDB {
  version: number;
  session: { userId: string } | null;
  users: User[];
  workspaces: Workspace[];
  accessRequests: AccessRequest[];
  invitations: Invitation[];
  audit: AuditEvent[];
  meetings: Meeting[];
  recordings: Recording[];
  transcripts: Transcript[];
  packSources: PackSource[];
  jobs: ProcessingJob[];
  settings: Settings[];
  onboarding: OnboardingState[];
  exportHistory: ExportHistoryEntry[];
  markers: StoredMarker[];
}

export const DB_VERSION = 2;

const T = {
  base: '2026-08-10T09:00:00.000Z',
  m1: '2026-08-10T18:30:00.000Z',
  m2: '2026-08-06T14:00:00.000Z',
  m3: '2026-08-05T11:15:00.000Z',
};

function defaultSettings(userId: string): Settings {
  return {
    userId,
    general: { displayName: 'Vinícius', uiLocale: 'pt-BR', timezone: 'America/Sao_Paulo' },
    recording: {
      preferredDeviceLabel: '',
      countdownSeconds: 3,
      autoMarkerOnPause: true,
      meetingLanguage: 'pt-BR',
    },
    export: {
      defaultPreset: 'ai',
      defaultSize: 'standard',
      defaultFormat: 'md',
      exportLanguage: 'en-US',
      includeEvidenceByDefault: true,
    },
    language: {
      uiLocale: 'pt-BR',
      meetingLanguage: 'pt-BR',
      transcriptLanguage: 'pt-BR',
      exportLanguage: 'en-US',
    },
    privacy: {
      storeAudioAfterProcessing: false,
      analyticsOptIn: true,
      redactEmailsInExports: false,
    },
    appearance: { theme: 'system', reducedMotion: false, density: 'comfortable' },
  };
}

/** m1 — the prototype's validated "Commercial meeting with Atlas". */
function atlasTranscript(): Transcript {
  return {
    meetingId: 'm1',
    language: 'pt-BR',
    updatedAt: T.m1,
    speakers: [
      { id: 'm1_sp1', diarizationLabel: 'Speaker 1', displayName: 'Rafael Martins', color: '#5B4AE6' },
      { id: 'm1_sp2', diarizationLabel: 'Speaker 2', displayName: 'João Silva', color: '#337965' },
      { id: 'm1_sp3', diarizationLabel: 'Speaker 3', displayName: 'Marina Costa', color: '#9A6416' },
      { id: 'm1_sp4', diarizationLabel: 'Speaker 4', displayName: 'Fernanda Rocha', color: '#B13D4C' },
    ],
    segments: [
      { id: 'm1_s1', speakerId: 'm1_sp1', startSeconds: 252, endSeconds: 268, text: 'A ideia é começar o piloto com uma unidade de negócio só.', edited: false, language: 'pt-BR' },
      { id: 'm1_s2', speakerId: 'm1_sp2', startSeconds: 696, endSeconds: 712, text: 'Precisamos entender o esforço da integração antes de assumir qualquer data.', edited: false, language: 'pt-BR' },
      { id: 'm1_s3', speakerId: 'm1_sp2', startSeconds: 1122, endSeconds: 1140, text: 'Sem a integração, não acho que a gente consiga rodar o piloto direito.', edited: false, language: 'pt-BR' },
      { id: 'm1_s4', speakerId: 'm1_sp3', startSeconds: 1445, endSeconds: 1462, text: 'O time de engenharia estimou três semanas, mas isso ainda não está fechado.', edited: false, language: 'pt-BR' },
      { id: 'm1_s5', speakerId: 'm1_sp3', startSeconds: 1938, endSeconds: 1952, text: 'Então outubro provavelmente é uma data mais realista.', edited: false, language: 'pt-BR' },
      { id: 'm1_s6', speakerId: 'm1_sp4', startSeconds: 2210, endSeconds: 2226, text: 'O faturamento anual entra na proposta ou fica separado?', edited: false, language: 'pt-BR' },
      { id: 'm1_s7', speakerId: 'm1_sp1', startSeconds: 2402, endSeconds: 2418, text: 'Vou confirmar o volume esperado com vocês antes de fechar o escopo.', edited: false, language: 'pt-BR' },
    ],
  };
}

function atlasPackSource(): PackSource {
  return {
    meetingId: 'm1',
    sections: [
      { key: 'metadata', confidence: 'explicit', lines: [
        { pt: 'Reunião comercial com Atlas · 10 ago 2026 · 42:18 · Português (Brasil) · Gravação no navegador',
          en: 'Commercial meeting with Atlas · Aug 10, 2026 · 42:18 · Portuguese (Brazil) · Browser recording' },
      ] },
      { key: 'participants', confidence: 'explicit', lines: [
        { text: 'Rafael Martins — Northstar' },
        { text: 'Marina Costa — Northstar' },
        { text: 'João Silva — Atlas' },
        { text: 'Fernanda Rocha — Atlas' },
      ] },
      { key: 'purpose', confidence: 'inferred', lines: [
        { pt: 'Discutir escopo do piloto, requisitos de integração e condições comerciais.',
          en: 'Discuss pilot scope, integration requirements and commercial conditions.' },
      ] },
      { key: 'executiveContext', confidence: 'inferred', lines: [
        { pt: 'A Atlas está avaliando um piloto. Os requisitos de integração se tornaram a principal fonte de incerteza durante a conversa.',
          en: 'Atlas is evaluating a pilot deployment. Integration requirements became the main source of uncertainty during the conversation.' },
      ] },
      { key: 'topics', confidence: 'explicit', lines: [
        { pt: 'Escopo do piloto · 04:12', en: 'Pilot scope · 04:12', atSeconds: 252 },
        { pt: 'Integração · 11:36', en: 'Integration · 11:36', atSeconds: 696 },
        { pt: 'Prazo · 32:18', en: 'Timeline · 32:18', atSeconds: 1938 },
        { pt: 'Condições comerciais · 36:50', en: 'Commercial terms · 36:50', atSeconds: 2210 },
      ] },
      { key: 'importantStatements', confidence: 'explicit', lines: [
        { text: 'João Silva: “Sem a integração, não acho que a gente consiga rodar o piloto direito.”', atSeconds: 1122 },
        { text: 'Marina Costa: “Então outubro provavelmente é uma data mais realista.”', atSeconds: 1938 },
      ] },
      { key: 'explicitDecisions', confidence: 'explicit', lines: [
        { pt: 'O piloto começa com uma unidade de negócio.', en: 'The pilot will start with one business unit.' },
        { pt: 'A integração precisa ser validada antes de qualquer expansão.', en: 'Integration must be validated before expansion.' },
      ] },
      { key: 'openPoints', confidence: 'explicit', lines: [
        { pt: 'Escopo final da integração continua indefinido.', en: 'Final integration scope remains undefined.' },
        { pt: 'A estimativa de volume não foi confirmada.', en: 'Volume estimate has not been confirmed.' },
        { pt: 'Condições comerciais precisam de mais discussão.', en: 'Commercial conditions require further discussion.' },
      ] },
      { key: 'questions', confidence: 'explicit', lines: [
        { pt: 'Quem será responsável pela integração?', en: 'Who will own the integration?' },
        { pt: 'Qual volume é esperado durante o piloto?', en: 'What volume is expected during the pilot?' },
        { pt: 'O faturamento anual é obrigatório?', en: 'Is annual billing required?' },
      ] },
      { key: 'numbersAndDates', confidence: 'explicit', lines: [
        { text: 'R$ 120.000' },
        { pt: 'Outubro de 2026', en: 'October 2026' },
        { pt: '500 transações mensais', en: '500 monthly transactions' },
        { pt: 'Estimativa de integração: 3 semanas', en: '3-week integration estimate' },
      ] },
      { key: 'ambiguities', confidence: 'uncertain', lines: [
        { pt: 'A data final de lançamento foi discutida, mas não confirmada formalmente.',
          en: 'The final launch date was discussed but not formally confirmed.' },
        { pt: 'Não está claro se o custo da integração está incluído na proposta.',
          en: 'It is unclear whether the integration cost is included in the proposal.' },
      ] },
    ],
  };
}

export function buildSeed(): MockDB {
  const workspace: Workspace = {
    id: 'w1', name: 'Apymine', slug: 'apymine', plan: 'pro', seats: 10,
    createdAt: T.base, updatedAt: T.base, archived: false,
  };

  const owner: User = {
    id: 'u1', email: 'vinicius@apymine.com', name: 'Vinícius', role: 'owner', status: 'active',
    workspaceId: 'w1', locale: 'pt-BR', createdAt: T.base, updatedAt: T.base, lastActiveAt: T.m2,
  };
  const member: User = {
    id: 'u2', email: 'marina@apymine.com', name: 'Marina', role: 'member', status: 'active',
    workspaceId: 'w1', locale: 'pt-BR', createdAt: T.base, updatedAt: T.base,
  };

  const accessRequests: AccessRequest[] = [
    { id: 'ar1', name: 'João Pereira', email: 'joao@startup.io', company: 'Startup.io', role: 'Head of Product', useCase: 'Organizar reuniões de discovery em contexto para IA.', preferredLocale: 'pt-BR', status: 'pending', createdAt: T.m2, updatedAt: T.m2 },
    { id: 'ar2', name: 'Emily Carter', email: 'emily@northwind.com', company: 'Northwind', role: 'Ops Manager', useCase: 'Summarize weekly ops meetings for the leadership team.', preferredLocale: 'en-US', status: 'pending', createdAt: T.m2, updatedAt: T.m2 },
    { id: 'ar3', name: 'Rafael Souza', email: 'rafael@acme.com', company: 'Acme', role: 'CTO', useCase: 'Feed engineering syncs into internal AI tools.', preferredLocale: 'pt-BR', status: 'approved', createdAt: T.base, updatedAt: T.m1, reviewedByUserId: 'u1', reviewedAt: T.m1, invitationId: 'inv1' },
    { id: 'ar4', name: 'Spam Bot', email: 'noise@spam.xyz', company: 'N/A', role: 'N/A', useCase: 'asdfasdf test test test test.', preferredLocale: 'en-US', status: 'rejected', createdAt: T.base, updatedAt: T.m1, reviewedByUserId: 'u1', reviewedAt: T.m1, rejectionReason: 'Insufficient information / likely spam.' },
  ];

  const invitations: Invitation[] = [
    { id: 'inv1', email: 'rafael@acme.com', workspaceId: 'w1', role: 'member', token: 'welcome-rafael', status: 'sent', accessRequestId: 'ar3', invitedByUserId: 'u1', createdAt: T.m1, expiresAt: '2026-08-25T00:00:00.000Z' },
  ];

  const audit: AuditEvent[] = [
    { id: 'au1', action: 'access_request.created', actorId: 'ar3', actorLabel: 'Rafael Souza', targetType: 'access_request', targetId: 'ar3', targetLabel: 'rafael@acme.com', createdAt: T.base },
    { id: 'au2', action: 'access_request.approved', actorId: 'u1', actorLabel: 'Vinícius', targetType: 'access_request', targetId: 'ar3', targetLabel: 'rafael@acme.com', createdAt: T.m1 },
    { id: 'au3', action: 'invitation.sent', actorId: 'u1', actorLabel: 'Vinícius', targetType: 'invitation', targetId: 'inv1', targetLabel: 'rafael@acme.com', createdAt: T.m1 },
    { id: 'au4', action: 'meeting.created', actorId: 'u1', actorLabel: 'Vinícius', targetType: 'meeting', targetId: 'm1', targetLabel: 'Reunião comercial com Atlas', createdAt: T.m1 },
  ];

  const recordings: Recording[] = [
    { id: 'r1', meetingId: 'm1', durationSeconds: 2538, audioRef: 'mock-audio://2538s', waveformPeaks: [0.3, 0.6, 0.8, 0.5, 0.9, 0.4, 0.7, 0.6, 0.5, 0.8, 0.3, 0.6, 0.7, 0.4, 0.8], createdAt: T.m1, source: 'recording' },
  ];

  const meetings: Meeting[] = [
    { id: 'm1', workspaceId: 'w1', ownerId: 'u1', title: 'Reunião comercial com Atlas', source: 'recording', status: 'ready', meetingLanguage: 'pt-BR', durationSeconds: 2538, participantCount: 4, createdAt: T.m1, updatedAt: T.m1, recordingId: 'r1', summaryLine: 'Piloto com uma unidade, integração a validar, condições comerciais em aberto.' },
    { id: 'm2', workspaceId: 'w1', ownerId: 'u1', title: 'Revisão de produto Q3', source: 'recording', status: 'processing', meetingLanguage: 'pt-BR', durationSeconds: 3484, participantCount: 3, createdAt: T.m2, updatedAt: T.m2, summaryLine: 'Processando…' },
    { id: 'm3', workspaceId: 'w1', ownerId: 'u1', title: 'Entrevista Product Designer', source: 'upload', status: 'failed', meetingLanguage: 'pt-BR', durationSeconds: 3082, participantCount: 2, createdAt: T.m3, updatedAt: T.m3, summaryLine: 'Falha no processamento.' },
  ];

  const jobs: ProcessingJob[] = [
    { id: 'j1', workspaceId: 'w1', meetingId: 'm1', type: 'ai_pack', status: 'completed', stage: 'ready_for_ai_pack', progress: 100, attempt: 1, maxAttempts: 3, createdAt: T.m1, startedAt: T.m1, completedAt: T.m1, updatedAt: T.m1 },
    { id: 'j2', workspaceId: 'w1', meetingId: 'm2', type: 'transcription', status: 'running', stage: 'transcribing', progress: 33, attempt: 1, maxAttempts: 3, createdAt: T.m2, startedAt: T.m2, updatedAt: T.m2 },
    { id: 'j3', workspaceId: 'w1', meetingId: 'm3', type: 'media_processing', status: 'failed', stage: 'preparing_audio', progress: 12, attempt: 3, maxAttempts: 3, errorCode: 'AUDIO_CORRUPT', errorMessage: 'The uploaded file could not be decoded.', createdAt: T.m3, startedAt: T.m3, updatedAt: T.m3 },
  ];

  const exportHistory: ExportHistoryEntry[] = [
    { id: 'ex1', meetingId: 'm1', meetingTitle: 'Reunião comercial com Atlas', at: T.m1, action: 'downloaded', preset: 'ai', size: 'standard', format: 'md', language: 'en-US', filename: 'loquia-reuniao-comercial-com-atlas-ai-pack.md', bytes: 1840 },
  ];

  const onboarding: OnboardingState[] = [
    { userId: 'u1', completed: true, currentStep: 4, totalSteps: 4, meetingLanguage: 'pt-BR', completedAt: T.base },
  ];

  return {
    version: DB_VERSION,
    session: { userId: 'u1' },
    users: [owner, member],
    workspaces: [workspace],
    accessRequests,
    invitations,
    audit,
    meetings,
    recordings,
    transcripts: [atlasTranscript()],
    packSources: [atlasPackSource()],
    jobs,
    settings: [defaultSettings('u1')],
    onboarding,
    exportHistory,
    markers: [
      { id: 'mk1', meetingId: 'm1', atSeconds: 1122, label: 'Integração', createdAt: T.m1, kind: 'user' },
    ],
  };
}
