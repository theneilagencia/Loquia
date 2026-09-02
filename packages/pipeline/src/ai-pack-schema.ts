import { z } from 'zod';
import type { PackSectionKey } from '@loquia/domain';

/**
 * Canonical AI Pack schema (Milestone 4). Bump this when the shape below
 * changes; it is persisted per version for reproduction/regeneration.
 */
export const SCHEMA_VERSION = 'aipack-3';

/**
 * The content sections the model extracts. `metadata`/`participants` are derived
 * from meeting data (never the LLM), and `instructions`/`evidence`/`transcript`
 * are produced by the export engine — so the model is constrained to exactly the
 * canonical synthesizable sections (docs/ai-pack-spec.md §Seções). It can never
 * invent a section outside this set.
 */
export const LLM_SECTION_KEYS = [
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
] as const satisfies readonly PackSectionKey[];

export type LlmSectionKey = (typeof LLM_SECTION_KEYS)[number];

export const factClassificationSchema = z.enum(['explicit', 'inferred', 'uncertain']);

export const candidateFactSchema = z.object({
  text: z.string(),
  classification: factClassificationSchema,
  /** Ids of the transcript segments that support this fact (may be empty). */
  segmentIds: z.array(z.string()),
});

export const candidateSectionSchema = z.object({
  key: z.enum(LLM_SECTION_KEYS),
  facts: z.array(candidateFactSchema),
});

export const candidateSchema = z.object({
  sections: z.array(candidateSectionSchema),
});

export type Candidate = z.infer<typeof candidateSchema>;
export type CandidateSection = z.infer<typeof candidateSectionSchema>;
export type CandidateFact = z.infer<typeof candidateFactSchema>;

export interface SchemaValidation {
  ok: boolean;
  value?: Candidate;
  error?: string;
}

/** Validate a raw model response against the canonical schema. */
export function validateCandidate(raw: unknown): SchemaValidation {
  const parsed = candidateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }
  // Reject unknown section keys defensively (enum already guards, but be explicit).
  for (const s of parsed.data.sections) {
    if (!LLM_SECTION_KEYS.includes(s.key as LlmSectionKey)) {
      return { ok: false, error: `unknown section key: ${s.key}` };
    }
  }
  return { ok: true, value: parsed.data };
}

/**
 * JSON Schema for the provider's structured-output constraint (Anthropic
 * `output_config.format`). Kept in sync with the Zod schema above. Uses only
 * the subset structured outputs support (no min/max/length; additionalProperties
 * false on every object).
 */
export const CANDIDATE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          key: { type: 'string', enum: [...LLM_SECTION_KEYS] },
          facts: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                text: { type: 'string' },
                classification: { type: 'string', enum: ['explicit', 'inferred', 'uncertain'] },
                segmentIds: { type: 'array', items: { type: 'string' } },
              },
              required: ['text', 'classification', 'segmentIds'],
            },
          },
        },
        required: ['key', 'facts'],
      },
    },
  },
  required: ['sections'],
} as const;
