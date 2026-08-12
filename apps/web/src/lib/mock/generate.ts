import type { Transcript } from '@loquia/domain';
import type { PackSource } from './pack-source';

/**
 * Deterministic demo content produced when a mock ProcessingJob reaches the
 * `ready` stage. No real STT — the same meeting always yields the same result.
 */
export function generateDemoContent(
  meetingId: string,
  meetingLanguage: string,
): { transcript: Transcript; packSource: PackSource } {
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
      { id: `${meetingId}_sp1`, diarizationLabel: 'Speaker 1', color: '#5B4AE6' },
      { id: `${meetingId}_sp2`, diarizationLabel: 'Speaker 2', color: '#337965' },
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

  const packSource: PackSource = {
    meetingId,
    sections: [
      { key: 'metadata', confidence: 'explicit', lines: [
        { pt: 'Reunião · ' + meetingLanguage, en: 'Meeting · ' + meetingLanguage },
      ] },
      { key: 'participants', confidence: 'explicit', lines: [
        { text: 'Speaker 1' },
        { text: 'Speaker 2' },
      ] },
      { key: 'purpose', confidence: 'inferred', lines: [
        { pt: 'Revisar o status do projeto e as oportunidades da descoberta.',
          en: 'Review project status and the discovery opportunities.' },
      ] },
      { key: 'topics', confidence: 'explicit', lines: [
        { pt: 'Status do projeto · 00:00', en: 'Project status · 00:00', atSeconds: 0 },
        { pt: 'Oportunidades · 00:15', en: 'Opportunities · 00:15', atSeconds: 15 },
      ] },
      { key: 'importantStatements', confidence: 'explicit', lines: [
        { text: lines[3] ?? '', atSeconds: 45 },
      ] },
      { key: 'explicitDecisions', confidence: 'explicit', lines: [
        { pt: 'Focar na primeira oportunidade no próximo sprint.',
          en: 'Focus on the first opportunity in the next sprint.' },
      ] },
      { key: 'openPoints', confidence: 'explicit', lines: [
        { pt: 'Dependência com o fornecedor externo em aberto.',
          en: 'Dependency with the external vendor is open.' },
      ] },
      { key: 'questions', confidence: 'explicit', lines: [
        { pt: 'Quem valida os requisitos?', en: 'Who validates the requirements?' },
      ] },
      { key: 'numbersAndDates', confidence: 'explicit', lines: [
        { pt: 'Sexta-feira', en: 'Friday' },
      ] },
    ],
  };

  return { transcript, packSource };
}
