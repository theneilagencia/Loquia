/**
 * Deterministic demo content for a processed meeting. Milestone 2 has NO real
 * STT/LLM — this stands in for transcription + AI Pack so the pipeline shape and
 * the shared export engine work end to end. Clearly mock (task §18).
 */
export function generateDemo(meetingId: string, meetingLanguage: string) {
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

  const segments = lines.map((text, i) => ({
    id: `${meetingId}_s${i + 1}`,
    speakerKey: `${meetingId}_sp${(i % 2) + 1}`,
    orderIndex: i,
    startSeconds: i * 15,
    endSeconds: i * 15 + 14,
    text,
    edited: false,
    language: meetingLanguage,
  }));

  const speakerAliases: Record<string, string> = {};

  const sourceSections = [
    { key: 'metadata', confidence: 'explicit', lines: [{ pt: 'Reunião · ' + meetingLanguage, en: 'Meeting · ' + meetingLanguage }] },
    { key: 'participants', confidence: 'explicit', lines: [{ text: 'Speaker 1' }, { text: 'Speaker 2' }] },
    { key: 'purpose', confidence: 'inferred', lines: [{ pt: 'Revisar o status do projeto e as oportunidades da descoberta.', en: 'Review project status and the discovery opportunities.' }] },
    { key: 'topics', confidence: 'explicit', lines: [{ pt: 'Status do projeto · 00:00', en: 'Project status · 00:00', atSeconds: 0 }] },
    { key: 'importantStatements', confidence: 'explicit', lines: [{ text: lines[3] ?? '', atSeconds: 45 }] },
    { key: 'explicitDecisions', confidence: 'explicit', lines: [{ pt: 'Focar na primeira oportunidade no próximo sprint.', en: 'Focus on the first opportunity in the next sprint.' }] },
    { key: 'openPoints', confidence: 'explicit', lines: [{ pt: 'Dependência com o fornecedor externo em aberto.', en: 'Dependency with the external vendor is open.' }] },
    { key: 'questions', confidence: 'explicit', lines: [{ pt: 'Quem valida os requisitos?', en: 'Who validates the requirements?' }] },
    { key: 'numbersAndDates', confidence: 'explicit', lines: [{ pt: 'Sexta-feira', en: 'Friday' }] },
  ];

  return { segments, speakerAliases, sourceSections };
}

export const SPEAKER_PALETTE = ['#5B4AE6', '#337965', '#9A6416', '#B13D4C', '#0EA5E9'];
