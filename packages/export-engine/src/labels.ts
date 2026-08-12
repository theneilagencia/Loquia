import type { AIPackSectionKey } from '@loquia/domain';

type Dict = Record<AIPackSectionKey, string>;

const PT: Dict = {
  overview: 'Resumo executivo',
  participants: 'Participantes',
  agenda: 'Pauta',
  key_points: 'Pontos-chave',
  decisions: 'Decisões',
  action_items: 'Ações',
  open_questions: 'Perguntas em aberto',
  risks: 'Riscos',
  commitments: 'Compromissos',
  metrics: 'Números e métricas',
  references: 'Referências',
  sentiment: 'Clima da reunião',
  glossary: 'Glossário',
  next_steps: 'Próximos passos',
};

const EN: Dict = {
  overview: 'Overview',
  participants: 'Participants',
  agenda: 'Agenda',
  key_points: 'Key points',
  decisions: 'Decisions',
  action_items: 'Action items',
  open_questions: 'Open questions',
  risks: 'Risks',
  commitments: 'Commitments',
  metrics: 'Metrics',
  references: 'References',
  sentiment: 'Meeting sentiment',
  glossary: 'Glossary',
  next_steps: 'Next steps',
};

export interface EngineStrings {
  sections: Dict;
  transcript: string;
  aiPack: string;
  evidence: string;
  inferred: string;
  uncertain: string;
  meeting: string;
  language: string;
  generatedAt: string;
  assignee: string;
  due: string;
}

const PT_STRINGS: EngineStrings = {
  sections: PT,
  transcript: 'Transcrição',
  aiPack: 'AI Pack',
  evidence: 'Evidência',
  inferred: 'inferido',
  uncertain: 'incerto',
  meeting: 'Reunião',
  language: 'Idioma',
  generatedAt: 'Gerado em',
  assignee: 'Responsável',
  due: 'Prazo',
};

const EN_STRINGS: EngineStrings = {
  sections: EN,
  transcript: 'Transcript',
  aiPack: 'AI Pack',
  evidence: 'Evidence',
  inferred: 'inferred',
  uncertain: 'uncertain',
  meeting: 'Meeting',
  language: 'Language',
  generatedAt: 'Generated at',
  assignee: 'Assignee',
  due: 'Due',
};

/** Resolve label set for an export language (falls back to English). */
export function stringsFor(language: string): EngineStrings {
  if (language.toLowerCase().startsWith('pt')) return PT_STRINGS;
  return EN_STRINGS;
}
