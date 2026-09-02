import type { ISODateString, LanguageTag } from './common';

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
  | 'summary'
  | 'purpose'
  | 'executiveContext'
  | 'topics'
  | 'importantStatements'
  | 'explicitDecisions'
  | 'actionItems'
  | 'openPoints'
  | 'risks'
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
  'summary',
  'purpose',
  'executiveContext',
  'topics',
  'importantStatements',
  'explicitDecisions',
  'actionItems',
  'openPoints',
  'risks',
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
  summary: 'Executive summary',
  purpose: 'Meeting purpose',
  executiveContext: 'Executive context',
  topics: 'Topics',
  importantStatements: 'Important statements',
  explicitDecisions: 'Explicit decisions',
  actionItems: 'Action items',
  openPoints: 'Open points',
  risks: 'Risks',
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
  summary: true,
  // purpose/topics are normally present but omitted when empty (no phrase).
  purpose: false,
  executiveContext: false,
  topics: false,
  importantStatements: false,
  explicitDecisions: true,
  actionItems: true,
  openPoints: true,
  risks: false,
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
  summary: { 'pt-BR': 'Resumo indisponível.', 'en-US': 'Summary unavailable.' },
  explicitDecisions: { 'pt-BR': 'Nenhuma decisão explícita.', 'en-US': 'No explicit decisions.' },
  actionItems: { 'pt-BR': 'Nenhuma ação definida.', 'en-US': 'No action items.' },
  openPoints: { 'pt-BR': 'Nenhum ponto aberto.', 'en-US': 'No open points.' },
};

/** Confidence marker attached to a section (explicit vs inferred vs uncertain). */
export type SectionConfidence = 'explicit' | 'inferred' | 'uncertain';

export interface AIPackLine {
  /** Rendered text (synthesized → output language; statements → original). */
  text: string;
  /** Optional evidence/seek pointer, in seconds. */
  atSeconds?: number;
  /** Original-language transcript excerpt this line is grounded in (the quote). */
  quote?: string;
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

// ---------------------------------------------------------------------------
// Persisted AI Pack source (JSONB) + resolution — shared by web, API and worker
// ---------------------------------------------------------------------------

/**
 * Bilingual AI Pack source, the persisted JSONB shape. Synthesized lines carry
 * `pt`/`en` (rendered in the output language); statements, evidence quotes and
 * numbers carry `text` (kept as-is regardless of output language — the
 * evidence-language rule, docs/ai-pack-spec.md §Idiomas).
 *
 * Evidence is anchored to real transcript segments: `segmentIds` reference
 * `TranscriptSegment.id`, and the authoritative `atSeconds`/`speakerId`/excerpt
 * are resolved from those segments (never invented by the model). The evidence
 * fields are additive — `resolvePack` only needs `text`/`pt`/`en`/`atSeconds`,
 * so older packs and the demo generator keep working unchanged.
 */
export interface SourceLine {
  pt?: string;
  en?: string;
  /** Original-language text (statements/evidence/numbers) — never translated. */
  text?: string;
  /** Seek pointer, in seconds — resolved from the cited segment(s). */
  atSeconds?: number;
  /** Original-language excerpt of the cited segment(s) — shown as the quote. */
  quote?: string;
  /** Evidence: ids of the TranscriptSegment(s) that support this line. */
  segmentIds?: string[];
  /** Resolved speaker of the primary cited segment (technical key). */
  speakerId?: string;
  /** Per-fact classification (may differ from the section's dominant one). */
  classification?: SectionConfidence;
}

export interface SourceSection {
  key: PackSectionKey;
  confidence: SectionConfidence;
  lines: SourceLine[];
}

export interface PackSource {
  meetingId: string;
  sections: SourceSection[];
}

/** Resolve a bilingual source into an AIPack for a given output language. */
export function resolvePack(source: PackSource, outputLanguage: string): AIPack {
  const pt = outputLanguage.toLowerCase().startsWith('pt');
  return {
    meetingId: source.meetingId,
    language: outputLanguage,
    sections: source.sections.map((s) => ({
      key: s.key,
      title: PACK_SECTION_TITLE[s.key],
      required: PACK_SECTION_REQUIRED[s.key],
      confidence: s.confidence,
      lines: s.lines.map((l) => {
        const text = l.text ?? (pt ? (l.pt ?? l.en ?? '') : (l.en ?? l.pt ?? ''));
        // Only show a quote when it adds something beyond the line text itself
        // (verbatim sections already render the excerpt as their text).
        const quote = l.quote && l.quote !== text ? l.quote : undefined;
        return { text, atSeconds: l.atSeconds, quote };
      }),
    })),
  };
}

/**
 * Dominant confidence for a set of per-fact classifications. A section is only
 * `explicit` when every fact is explicit; a single `uncertain` fact makes the
 * section uncertain; otherwise it is `inferred`. The model can never upgrade a
 * fact from inferred to explicit (docs, Milestone 4 §8).
 */
export function dominantConfidence(
  classifications: readonly SectionConfidence[],
): SectionConfidence {
  if (classifications.length === 0) return 'explicit';
  if (classifications.some((c) => c === 'uncertain')) return 'uncertain';
  if (classifications.some((c) => c === 'inferred')) return 'inferred';
  return 'explicit';
}

// ---------------------------------------------------------------------------
// AI Pack generation lifecycle (Milestone 4)
// ---------------------------------------------------------------------------

/**
 * AI Pack generation state, tracked on the meeting independently of the
 * transcript status. `not_started` = transcript ready but generation not asked
 * for; `queued`/`generating` = a job is in flight; `ready`/`failed` are terminal
 * (a `failed` generation always leaves the transcript intact).
 */
export type AIPackStatus = 'not_started' | 'queued' | 'generating' | 'ready' | 'failed';

/** Metadata recorded per generated version (reproduction + regeneration). */
export interface AIPackVersionMeta {
  version: number;
  provider: string;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  outputLanguage: string;
  generatedAt: ISODateString;
}
