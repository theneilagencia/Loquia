import type { PackSectionKey } from '@loquia/domain';

/**
 * AI Pack generation abstraction (Milestone 4). The domain never talks to an
 * LLM directly — a generator turns a real transcript into a provider-neutral,
 * structured candidate. The concrete provider (Anthropic, mock) never leaks
 * into the domain, the worker, or the UI.
 */

export type FactClassification = 'explicit' | 'inferred' | 'uncertain';

/** A participant as seen by the generator (never carries workspace secrets). */
export interface GenParticipant {
  id?: string;
  name: string;
  organization?: string | null;
  isExternal?: boolean;
}

/** A transcript segment as fed to the generator (IDs are explicit + stable). */
export interface GenSegment {
  id: string;
  speakerId: string;
  speakerLabel: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface AIPackGenerationInput {
  meeting: {
    id: string;
    workspaceId: string;
    title: string;
    /** Language actually spoken (evidence stays in this language). */
    language: string;
    source: string;
    durationSeconds: number;
    startedAt?: string;
  };
  participants: GenParticipant[];
  transcript: GenSegment[];
  /** Language for the synthesized structured content (docs/ai-pack-spec.md §Idiomas). */
  outputLanguage: string;
  preset?: string;
}

/**
 * One extracted fact. `text` is synthesized in the output language;
 * `segmentIds` reference the `TranscriptSegment.id`s that support it — the
 * authoritative timestamp/speaker/excerpt are resolved from those segments, so
 * a fabricated timestamp is impossible. `classification` distinguishes what was
 * said (`explicit`) from a reasonable inference (`inferred`) from ambiguous or
 * conflicting information (`uncertain`).
 */
export interface GeneratedFact {
  text: string;
  classification: FactClassification;
  segmentIds: string[];
}

export interface GeneratedSection {
  key: PackSectionKey;
  facts: GeneratedFact[];
}

export interface AIPackGenerationResult {
  sections: GeneratedSection[];
  outputLanguage: string;
  provider: string;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  /** Token usage / counts for future cost control (never invented). */
  usage?: { inputTokens?: number; outputTokens?: number; requestCount?: number };
}

export interface AIPackGenerator {
  readonly name: string;
  readonly model: string;
  generate(input: AIPackGenerationInput): Promise<AIPackGenerationResult>;
}
