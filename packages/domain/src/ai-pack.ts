import type { Id, ISODateString, LanguageTag } from './common';

/**
 * AI Pack — structured, evidence-linked context extracted from a transcript.
 *
 * NOTE (Milestone 1): the canonical `docs/ai-pack-spec.md` was absent from the
 * handoff. The 14 canonical section keys below are a reconstruction that honours
 * the invariants the task DID specify (§29–§30):
 *   - never invent: every item cites evidence;
 *   - explicit ≠ inferred: `origin` distinguishes them;
 *   - uncertainty preserved: `confidence` + `uncertain`;
 *   - evidence links to TranscriptSegment and keeps its ORIGINAL language;
 *   - an empty section does not render;
 *   - the structured AI Pack is the SOURCE OF TRUTH, never parsed back from Markdown.
 */

export type AIPackSectionKey =
  | 'overview'
  | 'participants'
  | 'agenda'
  | 'key_points'
  | 'decisions'
  | 'action_items'
  | 'open_questions'
  | 'risks'
  | 'commitments'
  | 'metrics'
  | 'references'
  | 'sentiment'
  | 'glossary'
  | 'next_steps';

/** Canonical order used for rendering and export. */
export const AI_PACK_SECTION_KEYS: readonly AIPackSectionKey[] = [
  'overview',
  'participants',
  'agenda',
  'key_points',
  'decisions',
  'action_items',
  'open_questions',
  'risks',
  'commitments',
  'metrics',
  'references',
  'sentiment',
  'glossary',
  'next_steps',
];

/** Whether a statement was said outright or inferred from context. */
export type ItemOrigin = 'explicit' | 'inferred';

export interface Evidence {
  /** The cited TranscriptSegment. */
  segmentId: Id;
  /** Verbatim quote — MUST stay in the segment's original language. */
  quote: string;
  language: LanguageTag;
  startSeconds: number;
}

export interface AIPackItem {
  id: Id;
  /** Structured text in the AI Pack's `language` (export/structured language). */
  text: string;
  origin: ItemOrigin;
  /** 0–1. Preserved end-to-end; low confidence is never silently dropped. */
  confidence: number;
  /** Explicitly flags residual uncertainty for the reader. */
  uncertain: boolean;
  /** At least one evidence link — items without evidence are not produced. */
  evidence: Evidence[];
  /** Optional owner/assignee for action items & commitments. */
  assignee?: string;
  dueLabel?: string;
}

export interface AIPackSection {
  key: AIPackSectionKey;
  items: AIPackItem[];
}

export interface AIPack {
  meetingId: Id;
  /** Language of the STRUCTURED text (may differ from transcript/evidence). */
  language: LanguageTag;
  sections: AIPackSection[];
  generatedAt: ISODateString;
  model: string;
  version: number;
}

/** Sections that actually have content (empty sections do not render). */
export function nonEmptySections(pack: AIPack): AIPackSection[] {
  const byKey = new Map(pack.sections.map((s) => [s.key, s]));
  return AI_PACK_SECTION_KEYS.map((key) => byKey.get(key)).filter(
    (s): s is AIPackSection => Boolean(s && s.items.length > 0),
  );
}
