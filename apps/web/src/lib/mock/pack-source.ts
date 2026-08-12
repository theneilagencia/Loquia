import {
  PACK_SECTION_REQUIRED,
  PACK_SECTION_TITLE,
  type AIPack,
  type PackSectionKey,
  type SectionConfidence,
} from '@loquia/domain';

/**
 * Bilingual AI Pack source. Synthesized lines carry `pt`/`en`; statements,
 * numbers already in original form carry `text` (kept as-is regardless of the
 * output language, honouring the evidence-language rule).
 */
export interface SourceLine {
  pt?: string;
  en?: string;
  /** Original-language text (statements/evidence) — never translated. */
  text?: string;
  atSeconds?: number;
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
      lines: s.lines.map((l) => ({
        text: l.text ?? (pt ? (l.pt ?? l.en ?? '') : (l.en ?? l.pt ?? '')),
        atSeconds: l.atSeconds,
      })),
    })),
  };
}
