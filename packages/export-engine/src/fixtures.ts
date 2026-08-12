import type { AIPack, Meeting, Transcript } from '@loquia/domain';

/** Deterministic fixtures for engine tests and demos. */

export function makeTranscript(overrides?: Partial<Transcript>): Transcript {
  return {
    meetingId: 'm1',
    language: 'pt-BR',
    updatedAt: '2026-08-12T13:00:00.000Z',
    speakers: [
      { id: 'sp1', diarizationLabel: 'Speaker 1', color: '#4f46e5' },
      { id: 'sp2', diarizationLabel: 'Speaker 2', displayName: 'Marina', color: '#0ea5e9' },
    ],
    segments: [
      {
        id: 'seg1',
        speakerId: 'sp1',
        startSeconds: 0,
        endSeconds: 8,
        text: 'Bom dia, vamos revisar o roadmap do trimestre.',
        edited: false,
        language: 'pt-BR',
      },
      {
        id: 'seg2',
        speakerId: 'sp2',
        startSeconds: 8,
        endSeconds: 20,
        text: 'Fechamos o contrato com a Acme por R$ 120 mil.',
        edited: false,
        language: 'pt-BR',
      },
    ],
    ...overrides,
  };
}

export function makeAIPack(overrides?: Partial<AIPack>): AIPack {
  return {
    meetingId: 'm1',
    language: 'en-US',
    generatedAt: '2026-08-12T13:05:00.000Z',
    model: 'mock-1',
    version: 1,
    sections: [
      {
        key: 'overview',
        items: [
          {
            id: 'i1',
            text: 'Quarterly roadmap review; Acme contract signed.',
            origin: 'explicit',
            confidence: 0.95,
            uncertain: false,
            evidence: [
              {
                segmentId: 'seg1',
                quote: 'vamos revisar o roadmap do trimestre',
                language: 'pt-BR',
                startSeconds: 0,
              },
            ],
          },
        ],
      },
      {
        key: 'metrics',
        items: [
          {
            id: 'i2',
            text: 'Acme contract value: BRL 120,000.',
            origin: 'explicit',
            confidence: 0.9,
            uncertain: false,
            evidence: [
              {
                segmentId: 'seg2',
                quote: 'Fechamos o contrato com a Acme por R$ 120 mil',
                language: 'pt-BR',
                startSeconds: 8,
              },
            ],
          },
        ],
      },
      {
        key: 'risks',
        items: [
          {
            id: 'i3',
            text: 'Delivery timeline may be tight given the new contract.',
            origin: 'inferred',
            confidence: 0.45,
            uncertain: true,
            evidence: [
              {
                segmentId: 'seg1',
                quote: 'roadmap do trimestre',
                language: 'pt-BR',
                startSeconds: 0,
              },
            ],
          },
        ],
      },
      // Empty section — must never render.
      { key: 'glossary', items: [] },
    ],
    ...overrides,
  };
}

export function makeMeeting(overrides?: Partial<Meeting>): Meeting {
  return {
    id: 'm1',
    workspaceId: 'w1',
    ownerId: 'u1',
    title: 'Roadmap Q3',
    source: 'recording',
    status: 'ready',
    meetingLanguage: 'pt-BR',
    durationSeconds: 1200,
    participantCount: 2,
    createdAt: '2026-08-12T12:40:00.000Z',
    updatedAt: '2026-08-12T13:05:00.000Z',
    recordingId: 'r1',
    ...overrides,
  };
}
