import type { GenSegment } from './ai-pack';

/**
 * Deterministic transcript chunking for long meetings (Milestone 4 §33, §34).
 * Groups whole segments (never splits one) into ordered chunks that fit a
 * character budget, with optional overlap. Deterministic: same input + options
 * always yields the same chunks — unit-tested and reproducible.
 */
export interface ChunkOptions {
  /** Soft cap on characters of transcript text per chunk. */
  maxCharsPerChunk: number;
  /** Number of trailing segments to repeat at the start of the next chunk. */
  overlapSegments: number;
}

export const DEFAULT_CHUNKING: ChunkOptions = {
  // Smaller chunks keep each LLM call's JSON output well under the token limit
  // (a big chunk made the model produce more facts than fit, truncating the
  // response and burning slow retries — long meetings appeared to hang). More,
  // smaller chunks generate in parallel and each finishes fast.
  maxCharsPerChunk: 6_000,
  overlapSegments: 1,
};

function segLen(seg: GenSegment): number {
  // Approximate the payload cost of a segment (text dominates; ids/labels add a little).
  return seg.text.length + seg.speakerLabel.length + seg.id.length + 24;
}

export function chunkTranscript(
  segments: GenSegment[],
  options: ChunkOptions = DEFAULT_CHUNKING,
): GenSegment[][] {
  if (segments.length === 0) return [];
  const maxChars = Math.max(1, options.maxCharsPerChunk);
  const overlap = Math.max(0, options.overlapSegments);

  const chunks: GenSegment[][] = [];
  let current: GenSegment[] = [];
  let size = 0;

  for (const seg of segments) {
    const len = segLen(seg);
    // Close the current chunk when adding this segment would overflow it and it
    // already holds at least one segment (a single oversize segment stays whole).
    if (current.length > 0 && size + len > maxChars) {
      chunks.push(current);
      const tail = overlap > 0 ? current.slice(-overlap) : [];
      current = [...tail];
      size = tail.reduce((acc, s) => acc + segLen(s), 0);
    }
    current.push(seg);
    size += len;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}
