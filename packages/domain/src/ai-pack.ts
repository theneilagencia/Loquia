import type { LanguageTag } from './common';

/**
 * AI Pack — reconciled with the validated handoff (docs/ai-pack-spec.md and the
 * prototype `packData`/`packPlan`/`packMarkdown`). A single plan generates every
 * format: meeting + preset + size + sections + format + language → pack → render.
 *
 * Section titles are the canonical English headers the prototype emits; the
 * synthesized LINE text is rendered in the output language, while important
 * statements, evidence quotes and the transcript always keep the original
 * spoken language.
 */

export type PackSectionKey =
  | 'instructions'
  | 'metadata'
  | 'participants'
  | 'purpose'
  | 'executiveContext'
  | 'topics'
  | 'importantStatements'
  | 'explicitDecisions'
  | 'openPoints'
  | 'questions'
  | 'numbersAndDates'
  | 'ambiguities'
  | 'evidence'
  | 'transcript';

/** Canonical order (docs/ai-pack-spec.md §Seções). */
export const PACK_SECTION_KEYS: readonly PackSectionKey[] = [
  'instructions',
  'metadata',
  'participants',
  'purpose',
  'executiveContext',
  'topics',
  'importantStatements',
  'explicitDecisions',
  'openPoints',
  'questions',
  'numbersAndDates',
  'ambiguities',
  'evidence',
  'transcript',
];

/** English canonical section headers (as emitted by the prototype). */
export const PACK_SECTION_TITLE: Record<PackSectionKey, string> = {
  instructions: 'Instructions for the AI',
  metadata: 'Meeting',
  participants: 'Participants',
  purpose: 'Meeting purpose',
  executiveContext: 'Executive context',
  topics: 'Topics',
  importantStatements: 'Important statements',
  explicitDecisions: 'Explicit decisions',
  openPoints: 'Open points',
  questions: 'Questions raised',
  numbersAndDates: 'Numbers and dates',
  ambiguities: 'Ambiguities',
  evidence: 'Evidence',
  transcript: 'Full transcript',
};

/**
 * Required sections show an explicit negative phrase when empty; optional
 * sections are omitted entirely (docs/ai-pack-spec.md, decisions §8).
 */
export const PACK_SECTION_REQUIRED: Record<PackSectionKey, boolean> = {
  instructions: false,
  metadata: true,
  participants: true,
  // purpose/topics are normally present but omitted when empty (no phrase).
  purpose: false,
  executiveContext: false,
  topics: false,
  importantStatements: false,
  explicitDecisions: true,
  openPoints: true,
  questions: false,
  numbersAndDates: false,
  ambiguities: false,
  evidence: false,
  transcript: false,
};

/** Bilingual negative phrase for a required section that came back empty. */
export const PACK_SECTION_EMPTY_PHRASE: Partial<
  Record<PackSectionKey, { 'pt-BR': string; 'en-US': string }>
> = {
  participants: { 'pt-BR': 'Participantes não identificados.', 'en-US': 'Participants not identified.' },
  explicitDecisions: { 'pt-BR': 'Nenhuma decisão explícita.', 'en-US': 'No explicit decisions.' },
  openPoints: { 'pt-BR': 'Nenhum ponto aberto.', 'en-US': 'No open points.' },
};

/** Confidence marker attached to a section (explicit vs inferred vs uncertain). */
export type SectionConfidence = 'explicit' | 'inferred' | 'uncertain';

export interface AIPackLine {
  /** Rendered text (synthesized → output language; statements → original). */
  text: string;
  /** Optional evidence/seek pointer, in seconds. */
  atSeconds?: number;
}

export interface AIPackSection {
  key: PackSectionKey;
  title: string;
  required: boolean;
  confidence: SectionConfidence;
  lines: AIPackLine[];
}

/** A resolved AI Pack (already in the chosen output language). */
export interface AIPack {
  meetingId: string;
  language: LanguageTag;
  /** Body sections in canonical order (metadata…ambiguities). */
  sections: AIPackSection[];
}

/**
 * On-screen rendering rule: a section renders when it has lines, OR it is
 * required (then it shows its negative phrase). Optional empty sections never
 * render (no decorative placeholder).
 */
export function visibleSections(pack: AIPack): AIPackSection[] {
  return pack.sections.filter((s) => s.lines.length > 0 || s.required);
}
