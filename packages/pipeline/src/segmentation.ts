import type { TranscriptionWord } from './transcription';

/**
 * Group diarized words into readable transcript segments (task §21, §23).
 * Deterministic: a new segment starts on speaker change, a long pause, or when a
 * segment grows too long — split at a sentence boundary when possible.
 */

export interface SegmentationOptions {
  /** Start a new segment when the gap between words exceeds this. */
  maxGapMs: number;
  /** Soft cap on a segment's spoken duration. */
  maxSegmentMs: number;
  /** Soft cap on a segment's word count. */
  maxWords: number;
}

export const DEFAULT_SEGMENTATION: SegmentationOptions = {
  maxGapMs: 1200,
  maxSegmentMs: 15_000,
  maxWords: 60,
};

export interface BuiltSpeaker {
  /** Stable within a meeting, e.g. "sp1". Not a persistent DB id. */
  key: string;
  providerSpeaker: number | null;
  label: string; // "Speaker 1", "Speaker 2", …
}

export interface BuiltSegment {
  speakerKey: string;
  startMs: number;
  endMs: number;
  text: string;
  sequence: number;
  wordCount: number;
  avgConfidence?: number;
}

export interface SegmentationResult {
  speakers: BuiltSpeaker[];
  segments: BuiltSegment[];
}

function endsSentence(text: string): boolean {
  return /[.!?…]$/.test(text.trim());
}

export function segmentTranscription(
  words: TranscriptionWord[],
  options: SegmentationOptions = DEFAULT_SEGMENTATION,
): SegmentationResult {
  const speakerKeyByProvider = new Map<number, string>();
  const speakers: BuiltSpeaker[] = [];
  const keyFor = (providerSpeaker: number | null): string => {
    const ps = providerSpeaker ?? -1;
    let key = speakerKeyByProvider.get(ps);
    if (!key) {
      key = `sp${speakers.length + 1}`;
      speakerKeyByProvider.set(ps, key);
      speakers.push({ key, providerSpeaker: providerSpeaker ?? null, label: `Speaker ${speakers.length + 1}` });
    }
    return key;
  };

  const segments: BuiltSegment[] = [];
  let current: { speakerKey: string; words: TranscriptionWord[] } | null = null;
  let sequence = 0;

  const flush = () => {
    if (!current || current.words.length === 0) return;
    const ws = current.words;
    const confidences = ws.map((w) => w.confidence).filter((c): c is number => typeof c === 'number');
    segments.push({
      speakerKey: current.speakerKey,
      startMs: ws[0]!.startMs,
      endMs: ws[ws.length - 1]!.endMs,
      text: ws.map((w) => w.text).join(' ').replace(/\s+([.,!?…;:])/g, '$1').trim(),
      sequence: sequence++,
      wordCount: ws.length,
      avgConfidence: confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : undefined,
    });
    current = null;
  };

  for (const word of words) {
    const speakerKey = keyFor(word.providerSpeaker ?? null);
    if (!current) {
      current = { speakerKey, words: [word] };
      continue;
    }
    const prev = current.words[current.words.length - 1]!;
    const gap = word.startMs - prev.endMs;
    const duration = word.endMs - current.words[0]!.startMs;
    const speakerChanged = speakerKey !== current.speakerKey;
    const tooLong =
      (duration > options.maxSegmentMs || current.words.length >= options.maxWords) && endsSentence(prev.text);

    if (speakerChanged || gap > options.maxGapMs || tooLong) {
      flush();
      current = { speakerKey, words: [word] };
    } else {
      current.words.push(word);
    }
  }
  flush();

  return { speakers, segments };
}
