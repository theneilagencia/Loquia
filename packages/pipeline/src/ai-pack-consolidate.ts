import type { FactClassification, GeneratedFact, GeneratedSection } from './ai-pack';
import { LLM_SECTION_KEYS } from './ai-pack-schema';

/**
 * Consolidate per-chunk section results into one set (Milestone 4 §35).
 * Deduplicates facts by normalized text within a section, unions their evidence
 * segment ids, and preserves divergences (different statements stay separate).
 * Never "resolves" a conflict without support: when the same fact arrives with
 * different classifications, the most cautious one wins — inferred never becomes
 * explicit.
 */

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?…]+$/u, '');
}

const RANK: Record<FactClassification, number> = { explicit: 0, inferred: 1, uncertain: 2 };

/** The more cautious of two classifications (higher rank = less confident). */
function mostCautious(a: FactClassification, b: FactClassification): FactClassification {
  return RANK[a] >= RANK[b] ? a : b;
}

export function consolidateSections(partials: GeneratedSection[][]): GeneratedSection[] {
  // Bucket facts by section key.
  const byKey = new Map<string, GeneratedFact[]>();
  for (const sections of partials) {
    for (const section of sections) {
      const list = byKey.get(section.key) ?? [];
      list.push(...section.facts);
      byKey.set(section.key, list);
    }
  }

  const result: GeneratedSection[] = [];
  // Preserve canonical section order.
  for (const key of LLM_SECTION_KEYS) {
    const facts = byKey.get(key);
    if (!facts || facts.length === 0) continue;

    const merged = new Map<string, GeneratedFact>();
    const order: string[] = [];
    for (const fact of facts) {
      const norm = normalize(fact.text);
      const existing = merged.get(norm);
      if (existing) {
        // Union evidence, keep the most cautious classification.
        const ids = new Set([...existing.segmentIds, ...fact.segmentIds]);
        existing.segmentIds = [...ids];
        existing.classification = mostCautious(existing.classification, fact.classification);
      } else {
        merged.set(norm, { text: fact.text, classification: fact.classification, segmentIds: [...new Set(fact.segmentIds)] });
        order.push(norm);
      }
    }
    let out = order.map((n) => merged.get(n)!);
    // The executive summary must be a SINGLE paragraph. When a meeting is split
    // into chunks each returns its own summary; keep only the most complete one
    // (longest) so the reader gets one tight briefing, not N overlapping ones.
    if (key === 'summary' && out.length > 1) {
      out = [out.reduce((a, b) => (b.text.length > a.text.length ? b : a))];
    }
    result.push({ key, facts: out });
  }
  return result;
}
