import {
  dominantConfidence,
  type PackSource,
  type SourceLine,
  type SourceSection,
  type SectionConfidence,
} from '@loquia/domain';
import type { AIPackGenerationInput, GeneratedSection, GenSegment } from './ai-pack';

/**
 * Evidence resolution + pack building (Milestone 4 §9–§13, §19–§23).
 *
 * The LLM returns segment ids; this module resolves the authoritative
 * timestamp, speaker and excerpt from the real transcript — never from the
 * model's output — and REJECTS hallucinated ids (ids that don't belong to this
 * meeting). Important statements and evidence show the ORIGINAL segment text,
 * not a reconstructed quote.
 */

/** Sections that show the original transcript text (never a synthesized line). */
const VERBATIM_SECTIONS = new Set(['importantStatements']);
/** Sections where a fact is only kept if it cites at least one real segment. */
const EVIDENCE_REQUIRED = new Set(['importantStatements']);

export interface BuildResult {
  source: PackSource;
  stats: {
    /** Facts removed entirely (evidence-required section with no valid citation). */
    droppedFacts: number;
    /** Facts kept, but whose cited ids did not resolve (evidence link omitted). */
    unresolvedEvidence: number;
    /** Distinct valid segment ids that survived resolution. */
    citedSegments: number;
    totalFacts: number;
  };
}

function metadataSection(input: AIPackGenerationInput): SourceSection {
  const lines: SourceLine[] = [
    { text: input.meeting.title },
    { text: `${Math.round(input.meeting.durationSeconds / 60)} min` },
    { text: input.meeting.language },
    { text: input.meeting.source },
  ];
  return { key: 'metadata', confidence: 'explicit', lines };
}

function participantsSection(input: AIPackGenerationInput): SourceSection {
  const lines: SourceLine[] = input.participants.map((p) => ({
    text: `${p.name}${p.organization ? ` (${p.organization})` : ''}${p.isExternal ? ' ·' : ''}`,
  }));
  return { key: 'participants', confidence: 'explicit', lines };
}

/**
 * Build the persisted PackSource from the model's structured sections and the
 * real segments. `outputLanguage` decides which language slot synthesized text
 * lands in so `resolvePack` renders it; evidence text stays original-language.
 */
export function buildPackSource(
  input: AIPackGenerationInput,
  sections: GeneratedSection[],
  segments: GenSegment[],
): BuildResult {
  const byId = new Map(segments.map((s) => [s.id, s]));
  const pt = input.outputLanguage.toLowerCase().startsWith('pt');
  const citedIds = new Set<string>();
  let droppedFacts = 0;
  let unresolvedEvidence = 0;
  let totalFacts = 0;

  const out: SourceSection[] = [metadataSection(input), participantsSection(input)];
  const evidenceLines: SourceLine[] = [];

  for (const section of sections) {
    const lines: SourceLine[] = [];
    const classifications: SectionConfidence[] = [];

    for (const fact of section.facts) {
      totalFacts += 1;
      // Referential integrity: keep only ids that exist in THIS meeting.
      const valid = fact.segmentIds.filter((id) => byId.has(id));
      // Sections that SHOW original transcript text require real evidence to
      // appear at all (a quote with no source is meaningless).
      if (EVIDENCE_REQUIRED.has(section.key) && valid.length === 0) {
        droppedFacts += 1;
        continue;
      }
      // For synthesized sections (purpose, decisions, numbers, …) keep the fact
      // even when its citation did not resolve: a coherent statement without a
      // clickable segment link is far better than silently dropping it and
      // returning an empty pack. The evidence link is simply omitted.
      if (fact.segmentIds.length > 0 && valid.length === 0) unresolvedEvidence += 1;

      const resolved = valid.map((id) => byId.get(id)!);
      const atSeconds = resolved.length ? Math.min(...resolved.map((s) => s.startSeconds)) : undefined;
      const speakerId = resolved[0]?.speakerId;
      valid.forEach((id) => citedIds.add(id));

      const line: SourceLine = {
        atSeconds,
        speakerId,
        segmentIds: valid.length ? valid : undefined,
        classification: fact.classification,
      };
      if (VERBATIM_SECTIONS.has(section.key) && resolved.length) {
        // Show the original words, never a reconstructed quote.
        line.text = resolved.map((s) => s.text).join(' ');
      } else if (pt) {
        line.pt = fact.text;
      } else {
        line.en = fact.text;
      }
      lines.push(line);
      classifications.push(fact.classification);

      // Evidence section derives from cited statements (original text + stamp).
      if (section.key === 'importantStatements' && resolved.length) {
        evidenceLines.push({ text: resolved.map((s) => s.text).join(' '), atSeconds, speakerId, segmentIds: valid });
      }
    }

    if (lines.length > 0) {
      out.push({ key: section.key, confidence: dominantConfidence(classifications), lines });
    }
  }

  if (evidenceLines.length > 0) {
    out.push({ key: 'evidence', confidence: 'explicit', lines: evidenceLines });
  }

  return {
    source: { meetingId: input.meeting.id, sections: out },
    stats: { droppedFacts, unresolvedEvidence, citedSegments: citedIds.size, totalFacts },
  };
}
