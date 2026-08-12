import type { AIPack, Transcript } from '@loquia/domain';

/**
 * Deterministic demo content produced when a mock ProcessingJob reaches the
 * `ready` stage. No real STT — the same meeting always yields the same result.
 */
export function generateDemoContent(
  meetingId: string,
  meetingLanguage: string,
): { transcript: Transcript; aiPack: AIPack } {
  const now = new Date().toISOString();
  const isPt = meetingLanguage.toLowerCase().startsWith('pt');

  const lines = isPt
    ? [
        'Obrigado por participarem. Vamos começar pelo status do projeto.',
        'O time concluiu a fase de descoberta e identificou três oportunidades.',
        'A principal decisão é focar na primeira oportunidade no próximo sprint.',
        'Existe um risco de dependência com o fornecedor externo.',
        'Ana vai preparar o documento de requisitos até sexta-feira.',
        'Combinado. Nos falamos na próxima semana para revisar o progresso.',
      ]
    : [
        'Thanks for joining. Let us start with the project status.',
        'The team finished discovery and found three opportunities.',
        'The main decision is to focus on the first opportunity next sprint.',
        'There is a dependency risk with the external vendor.',
        'Ana will prepare the requirements document by Friday.',
        'Agreed. Let us reconvene next week to review progress.',
      ];

  const transcript: Transcript = {
    meetingId,
    language: meetingLanguage,
    updatedAt: now,
    speakers: [
      { id: `${meetingId}_sp1`, diarizationLabel: 'Speaker 1', color: '#4f46e5' },
      { id: `${meetingId}_sp2`, diarizationLabel: 'Speaker 2', color: '#0ea5e9' },
    ],
    segments: lines.map((text, i) => ({
      id: `${meetingId}_s${i + 1}`,
      speakerId: `${meetingId}_sp${(i % 2) + 1}`,
      startSeconds: i * 15,
      endSeconds: i * 15 + 14,
      text,
      edited: false,
      language: meetingLanguage,
    })),
  };

  const evidenceLang = meetingLanguage;
  const aiPack: AIPack = {
    meetingId,
    language: 'en-US',
    generatedAt: now,
    model: 'mock-1',
    version: 1,
    sections: [
      {
        key: 'overview',
        items: [
          {
            id: `${meetingId}_o1`,
            text: 'Project status review; discovery complete with three opportunities identified.',
            origin: 'explicit',
            confidence: 0.9,
            uncertain: false,
            evidence: [{ segmentId: `${meetingId}_s2`, quote: lines[1] ?? '', language: evidenceLang, startSeconds: 15 }],
          },
        ],
      },
      {
        key: 'decisions',
        items: [
          {
            id: `${meetingId}_d1`,
            text: 'Focus on the first opportunity in the next sprint.',
            origin: 'explicit',
            confidence: 0.88,
            uncertain: false,
            evidence: [{ segmentId: `${meetingId}_s3`, quote: lines[2] ?? '', language: evidenceLang, startSeconds: 30 }],
          },
        ],
      },
      {
        key: 'action_items',
        items: [
          {
            id: `${meetingId}_a1`,
            text: 'Prepare the requirements document.',
            origin: 'explicit',
            confidence: 0.86,
            uncertain: false,
            assignee: 'Ana',
            dueLabel: isPt ? 'Sexta-feira' : 'Friday',
            evidence: [{ segmentId: `${meetingId}_s5`, quote: lines[4] ?? '', language: evidenceLang, startSeconds: 60 }],
          },
        ],
      },
      {
        key: 'risks',
        items: [
          {
            id: `${meetingId}_r1`,
            text: 'Dependency risk with the external vendor.',
            origin: 'explicit',
            confidence: 0.82,
            uncertain: false,
            evidence: [{ segmentId: `${meetingId}_s4`, quote: lines[3] ?? '', language: evidenceLang, startSeconds: 45 }],
          },
        ],
      },
      {
        key: 'next_steps',
        items: [
          {
            id: `${meetingId}_n1`,
            text: 'Reconvene next week to review progress.',
            origin: 'explicit',
            confidence: 0.85,
            uncertain: false,
            evidence: [{ segmentId: `${meetingId}_s6`, quote: lines[5] ?? '', language: evidenceLang, startSeconds: 75 }],
          },
        ],
      },
    ],
  };

  return { transcript, aiPack };
}
