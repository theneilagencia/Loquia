import type {
  AccessRequest,
  AIPack,
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
  aiPacks: AIPack[];
  jobs: ProcessingJob[];
  settings: Settings[];
  onboarding: OnboardingState[];
  exportHistory: ExportHistoryEntry[];
  markers: StoredMarker[];
}

export const DB_VERSION = 1;

const T = {
  base: '2026-08-10T09:00:00.000Z',
  m1: '2026-08-11T14:30:00.000Z',
  m2: '2026-08-12T10:00:00.000Z',
  m3: '2026-08-12T11:15:00.000Z',
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
      defaultPreset: 'ai_pack',
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

function meeting1Transcript(): Transcript {
  return {
    meetingId: 'm1',
    language: 'pt-BR',
    updatedAt: T.m1,
    speakers: [
      { id: 'm1_sp1', diarizationLabel: 'Speaker 1', displayName: 'Vinícius', color: '#4f46e5' },
      { id: 'm1_sp2', diarizationLabel: 'Speaker 2', displayName: 'Marina', color: '#0ea5e9' },
      { id: 'm1_sp3', diarizationLabel: 'Speaker 3', color: '#f59e0b' },
    ],
    segments: [
      { id: 'm1_s1', speakerId: 'm1_sp1', startSeconds: 0, endSeconds: 9, text: 'Bom dia a todos. Hoje vamos revisar o roadmap do trimestre e fechar as prioridades.', edited: false, language: 'pt-BR' },
      { id: 'm1_s2', speakerId: 'm1_sp2', startSeconds: 9, endSeconds: 22, text: 'Perfeito. A primeira coisa é o lançamento da Loquia. Fechamos o contrato com a Acme por R$ 120 mil.', edited: false, language: 'pt-BR' },
      { id: 'm1_s3', speakerId: 'm1_sp1', startSeconds: 22, endSeconds: 34, text: 'Ótimo. Então a decisão é priorizar a integração da Acme antes do fim de agosto.', edited: false, language: 'pt-BR' },
      { id: 'm1_s4', speakerId: 'm1_sp3', startSeconds: 34, endSeconds: 48, text: 'Só um risco: se a equipe de dados não entregar o pipeline até dia 20, o prazo aperta.', edited: false, language: 'pt-BR' },
      { id: 'm1_s5', speakerId: 'm1_sp2', startSeconds: 48, endSeconds: 60, text: 'Anotado. Marina fica responsável por alinhar com o time de dados até quarta.', edited: false, language: 'pt-BR' },
      { id: 'm1_s6', speakerId: 'm1_sp1', startSeconds: 60, endSeconds: 72, text: 'Fechado. Próximos passos: eu preparo a proposta e a Marina valida o cronograma.', edited: false, language: 'pt-BR' },
    ],
  };
}

function meeting1AIPack(): AIPack {
  return {
    meetingId: 'm1',
    language: 'en-US',
    generatedAt: T.m1,
    model: 'mock-1',
    version: 1,
    sections: [
      {
        key: 'overview',
        items: [
          { id: 'm1_o1', text: 'Quarterly roadmap review focused on prioritizing the Acme integration ahead of the launch.', origin: 'explicit', confidence: 0.94, uncertain: false, evidence: [{ segmentId: 'm1_s1', quote: 'vamos revisar o roadmap do trimestre e fechar as prioridades', language: 'pt-BR', startSeconds: 0 }] },
        ],
      },
      {
        key: 'participants',
        items: [
          { id: 'm1_p1', text: 'Vinícius (lead), Marina (delivery), and a third participant from the data team.', origin: 'explicit', confidence: 0.8, uncertain: false, evidence: [{ segmentId: 'm1_s5', quote: 'Marina fica responsável por alinhar com o time de dados', language: 'pt-BR', startSeconds: 48 }] },
        ],
      },
      {
        key: 'decisions',
        items: [
          { id: 'm1_d1', text: 'Prioritize the Acme integration before the end of August.', origin: 'explicit', confidence: 0.92, uncertain: false, evidence: [{ segmentId: 'm1_s3', quote: 'priorizar a integração da Acme antes do fim de agosto', language: 'pt-BR', startSeconds: 22 }] },
        ],
      },
      {
        key: 'action_items',
        items: [
          { id: 'm1_a1', text: 'Align the delivery schedule with the data team.', origin: 'explicit', confidence: 0.9, uncertain: false, assignee: 'Marina', dueLabel: 'Wednesday', evidence: [{ segmentId: 'm1_s5', quote: 'Marina fica responsável por alinhar com o time de dados até quarta', language: 'pt-BR', startSeconds: 48 }] },
          { id: 'm1_a2', text: 'Prepare the commercial proposal.', origin: 'explicit', confidence: 0.85, uncertain: false, assignee: 'Vinícius', evidence: [{ segmentId: 'm1_s6', quote: 'eu preparo a proposta', language: 'pt-BR', startSeconds: 60 }] },
        ],
      },
      {
        key: 'risks',
        items: [
          { id: 'm1_r1', text: 'If the data pipeline is not delivered by the 20th, the deadline becomes tight.', origin: 'explicit', confidence: 0.88, uncertain: false, evidence: [{ segmentId: 'm1_s4', quote: 'se a equipe de dados não entregar o pipeline até dia 20, o prazo aperta', language: 'pt-BR', startSeconds: 34 }] },
        ],
      },
      {
        key: 'metrics',
        items: [
          { id: 'm1_me1', text: 'Acme contract value: BRL 120,000.', origin: 'explicit', confidence: 0.9, uncertain: false, evidence: [{ segmentId: 'm1_s2', quote: 'Fechamos o contrato com a Acme por R$ 120 mil', language: 'pt-BR', startSeconds: 9 }] },
        ],
      },
      {
        key: 'next_steps',
        items: [
          { id: 'm1_n1', text: 'Vinícius prepares the proposal; Marina validates the schedule.', origin: 'explicit', confidence: 0.9, uncertain: false, evidence: [{ segmentId: 'm1_s6', quote: 'eu preparo a proposta e a Marina valida o cronograma', language: 'pt-BR', startSeconds: 60 }] },
        ],
      },
      {
        key: 'sentiment',
        items: [
          { id: 'm1_se1', text: 'Constructive and aligned; mild concern about the data dependency.', origin: 'inferred', confidence: 0.5, uncertain: true, evidence: [{ segmentId: 'm1_s4', quote: 'Só um risco', language: 'pt-BR', startSeconds: 34 }] },
        ],
      },
    ],
  };
}

export function buildSeed(): MockDB {
  const workspace: Workspace = {
    id: 'w1',
    name: 'Apymine',
    slug: 'apymine',
    plan: 'pro',
    seats: 10,
    createdAt: T.base,
    updatedAt: T.base,
    archived: false,
  };

  const owner: User = {
    id: 'u1',
    email: 'vinicius@apymine.com',
    name: 'Vinícius',
    role: 'owner',
    status: 'active',
    workspaceId: 'w1',
    locale: 'pt-BR',
    createdAt: T.base,
    updatedAt: T.base,
    lastActiveAt: T.m2,
  };

  const member: User = {
    id: 'u2',
    email: 'marina@apymine.com',
    name: 'Marina',
    role: 'member',
    status: 'active',
    workspaceId: 'w1',
    locale: 'pt-BR',
    createdAt: T.base,
    updatedAt: T.base,
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
    { id: 'au4', action: 'meeting.created', actorId: 'u1', actorLabel: 'Vinícius', targetType: 'meeting', targetId: 'm1', targetLabel: 'Roadmap Q3', createdAt: T.m1 },
  ];

  const recordings: Recording[] = [
    { id: 'r1', meetingId: 'm1', durationSeconds: 72, audioRef: 'mock-audio://72s', waveformPeaks: [0.3, 0.6, 0.8, 0.5, 0.9, 0.4, 0.7, 0.6, 0.5, 0.8, 0.3, 0.6], createdAt: T.m1, source: 'recording' },
  ];

  const meetings: Meeting[] = [
    { id: 'm1', workspaceId: 'w1', ownerId: 'u1', title: 'Roadmap Q3', source: 'recording', status: 'ready', meetingLanguage: 'pt-BR', durationSeconds: 72, participantCount: 3, createdAt: T.m1, updatedAt: T.m1, recordingId: 'r1', summaryLine: 'Prioridade Acme, riscos de dados, próximos passos.' },
    { id: 'm2', workspaceId: 'w1', ownerId: 'u1', title: 'Weekly Ops Sync', source: 'upload', status: 'processing', meetingLanguage: 'en-US', durationSeconds: 540, participantCount: 4, createdAt: T.m2, updatedAt: T.m2, summaryLine: 'Processando…' },
    { id: 'm3', workspaceId: 'w1', ownerId: 'u1', title: 'Entrevista com candidato', source: 'upload', status: 'failed', meetingLanguage: 'pt-BR', durationSeconds: 300, participantCount: 2, createdAt: T.m3, updatedAt: T.m3, summaryLine: 'Falha no processamento.' },
  ];

  const jobs: ProcessingJob[] = [
    { id: 'j1', workspaceId: 'w1', meetingId: 'm1', type: 'ai_pack', status: 'completed', stage: 'ready', progress: 100, attempt: 1, maxAttempts: 3, createdAt: T.m1, startedAt: T.m1, completedAt: T.m1, updatedAt: T.m1 },
    { id: 'j2', workspaceId: 'w1', meetingId: 'm2', type: 'transcription', status: 'running', stage: 'transcribing', progress: 33, attempt: 1, maxAttempts: 3, createdAt: T.m2, startedAt: T.m2, updatedAt: T.m2 },
    { id: 'j3', workspaceId: 'w1', meetingId: 'm3', type: 'media_processing', status: 'failed', stage: 'preparing_audio', progress: 12, attempt: 3, maxAttempts: 3, errorCode: 'AUDIO_CORRUPT', errorMessage: 'The uploaded file could not be decoded.', createdAt: T.m3, startedAt: T.m3, updatedAt: T.m3 },
  ];

  const transcripts: Transcript[] = [meeting1Transcript()];
  const aiPacks: AIPack[] = [meeting1AIPack()];

  const exportHistory: ExportHistoryEntry[] = [
    { id: 'ex1', meetingId: 'm1', meetingTitle: 'Roadmap Q3', preset: 'ai_pack', size: 'standard', format: 'md', language: 'en-US', filename: 'roadmap-q3-ai_pack-standard.md', bytes: 1840, createdAt: T.m1, channel: 'download' },
  ];

  const onboarding: OnboardingState[] = [
    { userId: 'u1', completed: true, currentStep: 3, totalSteps: 3, meetingLanguage: 'pt-BR', completedAt: T.base },
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
    transcripts,
    aiPacks,
    jobs,
    settings: [defaultSettings('u1')],
    onboarding,
    exportHistory,
    markers: [
      { id: 'mk1', meetingId: 'm1', atSeconds: 34, label: 'Risco de dados', createdAt: T.m1, kind: 'user' },
    ],
  };
}
