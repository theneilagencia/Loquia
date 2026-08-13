import type { PackSource } from '@loquia/domain';

/**
 * Deterministic AI Pack factual-integrity evaluation (Milestone 5 §22–§24).
 * This is generator-agnostic: it validates a PERSISTED pack against the real
 * transcript segments, independent of any LLM. It is the gate that guarantees
 * evidence references are valid, timestamps derive from segments, and cited
 * excerpts are the original words — never a reconstructed quote.
 */

/** Sections that must carry valid evidence (a claim without support is critical). */
const EVIDENCE_REQUIRED = new Set(['importantStatements', 'evidence']);

export interface IntegritySegment {
  id: string;
  startSeconds: number;
  text: string;
}

export interface IntegrityReport {
  totalLines: number;
  evidenceLines: number;
  validEvidenceRefs: number;
  invalidEvidenceRefs: number;
  /** validRefs / (validRefs + invalidRefs); 1 = every cited id resolves. */
  evidenceReferenceValidity: number;
  /** Every line's atSeconds matches a cited segment's start. */
  timestampsDerived: boolean;
  /** Every verbatim (text-carrying, evidence-cited) line equals its segments' text. */
  excerptsDerived: boolean;
  /** Evidence-required lines that cite no valid segment (must be 0). */
  unsupportedCriticalClaims: number;
  invalidRefs: Array<{ section: string; segmentId: string }>;
}

export function evaluateAIPackIntegrity(source: PackSource, segments: IntegritySegment[]): IntegrityReport {
  const byId = new Map(segments.map((s) => [s.id, s]));

  let totalLines = 0;
  let evidenceLines = 0;
  let validRefs = 0;
  let invalidRefs = 0;
  let unsupportedCritical = 0;
  let timestampsDerived = true;
  let excerptsDerived = true;
  const invalid: Array<{ section: string; segmentId: string }> = [];

  for (const section of source.sections) {
    for (const line of section.lines) {
      totalLines += 1;
      const ids = line.segmentIds ?? [];
      if (ids.length > 0) evidenceLines += 1;

      for (const id of ids) {
        if (byId.has(id)) validRefs += 1;
        else {
          invalidRefs += 1;
          invalid.push({ section: section.key, segmentId: id });
        }
      }

      if (EVIDENCE_REQUIRED.has(section.key) && !ids.some((id) => byId.has(id))) {
        unsupportedCritical += 1;
      }

      // Timestamp must be one of the cited segments' starts.
      if (line.atSeconds != null && ids.length > 0) {
        const starts = ids.map((id) => byId.get(id)?.startSeconds).filter((v): v is number => v != null);
        if (starts.length > 0 && !starts.includes(line.atSeconds)) timestampsDerived = false;
      }

      // Verbatim lines (carry `text` AND cite segments) must equal the segments' text.
      if (line.text != null && ids.length > 0) {
        const resolved = ids.map((id) => byId.get(id)?.text).filter((v): v is string => v != null);
        if (resolved.length > 0) {
          const expected = resolved.join(' ');
          if (line.text !== expected) excerptsDerived = false;
        }
      }
    }
  }

  const refTotal = validRefs + invalidRefs;
  return {
    totalLines,
    evidenceLines,
    validEvidenceRefs: validRefs,
    invalidEvidenceRefs: invalidRefs,
    evidenceReferenceValidity: refTotal === 0 ? 1 : validRefs / refTotal,
    timestampsDerived,
    excerptsDerived,
    unsupportedCriticalClaims: unsupportedCritical,
    invalidRefs: invalid,
  };
}
