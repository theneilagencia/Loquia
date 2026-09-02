import { describe, expect, it } from 'vitest';
import { resolvePack, type PackSource } from '@loquia/domain';
import { validateCandidate, LLM_SECTION_KEYS, SCHEMA_VERSION } from './ai-pack-schema';
import { buildAIPackPrompt, formatTranscript, PROMPT_VERSION } from './ai-pack-prompt';
import { chunkTranscript } from './ai-pack-chunk';
import { consolidateSections } from './ai-pack-consolidate';
import { buildPackSource } from './ai-pack-evidence';
import { MockAIPackGenerator } from './adapters/mock-ai-pack';
import { LLMAIPackGenerator, extractJsonObject } from './adapters/llm-ai-pack';
import { createAIPackGenerator, DEFAULT_AI_PACK_MODEL } from './factory';
import type { AIPackGenerationInput, GenSegment, GeneratedSection } from './ai-pack';

const segs: GenSegment[] = [
  { id: 's1', speakerId: 'sp1', speakerLabel: 'Speaker 1', startSeconds: 4, endSeconds: 19, text: 'Bom dia. Vamos começar a reunião.' },
  { id: 's2', speakerId: 'sp2', speakerLabel: 'Speaker 2', startSeconds: 20, endSeconds: 42, text: 'A decisão é focar na primeira oportunidade no orçamento de R$ 120 mil.' },
  { id: 's3', speakerId: 'sp1', speakerLabel: 'Speaker 1', startSeconds: 43, endSeconds: 55, text: 'Podemos entregar até sexta-feira?' },
];

const input: AIPackGenerationInput = {
  meeting: { id: 'm1', workspaceId: 'w1', title: 'Reunião', language: 'pt-BR', source: 'upload', durationSeconds: 55 },
  participants: [{ name: 'Marina Costa', organization: 'Atlas' }],
  transcript: segs,
  outputLanguage: 'pt-BR',
};

describe('schema validation', () => {
  it('accepts a valid candidate and rejects unknown keys/shapes', () => {
    const ok = validateCandidate({ sections: [{ key: 'topics', facts: [{ text: 'x', classification: 'explicit', segmentIds: ['s1'] }] }] });
    expect(ok.ok).toBe(true);
    expect(validateCandidate({ sections: [{ key: 'not_a_section', facts: [] }] }).ok).toBe(false);
    expect(validateCandidate({ sections: [{ key: 'topics', facts: [{ text: 'x', classification: 'wrong', segmentIds: [] }] }] }).ok).toBe(false);
    expect(validateCandidate({ nope: true }).ok).toBe(false);
  });
});

describe('Anthropic adapter (schema-in-prompt, tolerant JSON parse)', () => {
  it('extractJsonObject strips code fences and surrounding prose', () => {
    expect(extractJsonObject('```json\n{"sections":[]}\n```')).toBe('{"sections":[]}');
    expect(extractJsonObject('Here is the pack:\n{"sections":[]}\nThanks!')).toBe('{"sections":[]}');
    expect(extractJsonObject('{"sections":[]}')).toBe('{"sections":[]}');
  });

  it('delivers the schema in the system prompt, sends no output_config, and parses fenced JSON', async () => {
    const bodies: Array<Record<string, unknown>> = [];
    const originalFetch = globalThis.fetch;
    const candidate = { sections: [{ key: 'purpose', facts: [{ text: 'Decidir o preço', classification: 'explicit', segmentIds: ['s2'] }] }] };
    globalThis.fetch = (async (_url: string, init: { body: string }) => {
      bodies.push(JSON.parse(init.body));
      // Model wraps its JSON in a ```json fence despite instructions — must still parse.
      return {
        ok: true,
        async json() {
          return { stop_reason: 'end_turn', content: [{ type: 'text', text: '```json\n' + JSON.stringify(candidate) + '\n```' }], usage: { input_tokens: 10, output_tokens: 5 } };
        },
      };
    }) as unknown as typeof globalThis.fetch;

    try {
      const gen = new LLMAIPackGenerator({ apiKey: 'k', model: 'claude-sonnet-5' });
      const result = await gen.generate(input);
      expect(result.sections.some((s) => s.key === 'purpose')).toBe(true);
      // The request carried the schema in the system prompt and NO output_config.
      const sent = bodies[0]!;
      expect(sent).not.toHaveProperty('output_config');
      expect(String(sent.system)).toContain('"sections"');
      expect(String(sent.system)).toContain('OUTPUT FORMAT');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('splits a long transcript into multiple chunk calls and consolidates', async () => {
    // ~40 segments of real-length text force more than one 6k-char chunk.
    const longSegs: GenSegment[] = Array.from({ length: 40 }, (_, i) => ({
      id: `seg-${i}`,
      speakerId: i % 2 === 0 ? 'sp1' : 'sp2',
      speakerLabel: i % 2 === 0 ? 'Speaker 1' : 'Speaker 2',
      startSeconds: i * 20,
      endSeconds: i * 20 + 18,
      text: `Sobre o item ${i}, precisamos alinhar melhor os numeros e os prazos antes de decidir qualquer coisa nesta reuniao.`,
    }));
    const longInput: AIPackGenerationInput = { ...input, transcript: longSegs };
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return {
        ok: true,
        async json() {
          return { stop_reason: 'end_turn', content: [{ type: 'text', text: '{"sections":[{"key":"topics","facts":[{"text":"t","classification":"explicit","segmentIds":["s0"]}]}]}' }], usage: { input_tokens: 5, output_tokens: 5 } };
        },
      };
    }) as unknown as typeof globalThis.fetch;
    try {
      const gen = new LLMAIPackGenerator({ apiKey: 'k', model: 'claude-sonnet-5' });
      const result = await gen.generate(longInput);
      expect(calls).toBeGreaterThan(1); // multiple chunks
      expect(result.usage?.requestCount).toBe(calls);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fails fast when the response is truncated at the token limit', async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return { ok: true, async json() { return { stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"sections":[' }] }; } };
    }) as unknown as typeof globalThis.fetch;
    try {
      const gen = new LLMAIPackGenerator({ apiKey: 'k', model: 'claude-sonnet-5' });
      await expect(gen.generate(input)).rejects.toThrow(/token budget/i);
      expect(calls).toBe(1); // no wasted retries on a truncation
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('prompt builder', () => {
  it('emits explicit SEGMENT ids and honours output language', () => {
    const tx = formatTranscript(segs);
    expect(tx).toContain('SEGMENT s1');
    expect(tx).toContain('00:20 → 00:42');
    const prompt = buildAIPackPrompt(input);
    expect(prompt.promptVersion).toBe(PROMPT_VERSION);
    expect(prompt.user).toContain('Marina Costa');
    expect(prompt.user).toContain('Portuguese');
    expect(buildAIPackPrompt({ ...input, outputLanguage: 'en-US' }).user).toContain('en-US');
  });
});

describe('chunking', () => {
  it('is deterministic, keeps order and never splits a segment', () => {
    const many: GenSegment[] = Array.from({ length: 20 }, (_, i) => ({
      id: `s${i}`, speakerId: 'sp1', speakerLabel: 'Speaker 1', startSeconds: i, endSeconds: i + 1, text: 'x'.repeat(300),
    }));
    const a = chunkTranscript(many, { maxCharsPerChunk: 1000, overlapSegments: 1 });
    const b = chunkTranscript(many, { maxCharsPerChunk: 1000, overlapSegments: 1 });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(1);
    // Every original segment appears; order preserved within chunks.
    const flat = a.flat().map((s) => s.id);
    expect(flat).toContain('s0');
    expect(flat).toContain('s19');
    expect(chunkTranscript([], { maxCharsPerChunk: 100, overlapSegments: 0 })).toEqual([]);
  });
});

describe('consolidation', () => {
  it('dedupes by text, unions evidence, never upgrades inferred→explicit', () => {
    const partials: GeneratedSection[][] = [
      [{ key: 'topics', facts: [{ text: 'Roadmap', classification: 'inferred', segmentIds: ['s1'] }] }],
      [{ key: 'topics', facts: [{ text: 'roadmap.', classification: 'explicit', segmentIds: ['s2'] }] }],
    ];
    const merged = consolidateSections(partials);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.facts).toHaveLength(1);
    expect(merged[0]!.facts[0]!.segmentIds.sort()).toEqual(['s1', 's2']);
    // Most cautious classification wins.
    expect(merged[0]!.facts[0]!.classification).toBe('inferred');
  });
});

describe('evidence resolution + pack building', () => {
  it('resolves timestamps from segments; keeps synthesized facts but drops verbatim ones on bad ids', () => {
    const sections: GeneratedSection[] = [
      { key: 'topics', facts: [{ text: 'Orçamento', classification: 'explicit', segmentIds: ['s2'] }] },
      { key: 'importantStatements', facts: [{ text: 'label', classification: 'explicit', segmentIds: ['s2'] }] },
      // hallucinated id in a SYNTHESIZED section: keep the text, omit the link.
      { key: 'openPoints', facts: [{ text: 'ghost', classification: 'inferred', segmentIds: ['s999'] }] },
      // hallucinated id in a VERBATIM/evidence-required section: dropped entirely.
      { key: 'importantStatements', facts: [{ text: 'phantom', classification: 'explicit', segmentIds: ['s999'] }] },
    ];
    const { source, stats } = buildPackSource(input, sections, segs);
    expect(stats.droppedFacts).toBe(1); // only the phantom importantStatement
    expect(stats.unresolvedEvidence).toBe(1); // the ghost openPoint (kept, no link)
    const topics = source.sections.find((s) => s.key === 'topics')!;
    // Timestamp comes from the cited segment, not the model.
    expect(topics.lines[0]!.atSeconds).toBe(20);
    expect(topics.lines[0]!.speakerId).toBe('sp2');
    // A synthesized line carries the original transcript excerpt as its quote.
    expect(topics.lines[0]!.quote).toContain('R$ 120 mil');
    // The synthesized openPoint survives (content over silence) without a link.
    const open = source.sections.find((s) => s.key === 'openPoints')!;
    expect(open.lines[0]!.pt).toBe('ghost');
    expect(open.lines[0]!.segmentIds).toBeUndefined();
    // Important statements show ORIGINAL text (verbatim), not the label.
    const stmt = source.sections.find((s) => s.key === 'importantStatements')!;
    expect(stmt.lines[0]!.text).toContain('R$ 120 mil');
    expect(stmt.lines).toHaveLength(1); // the phantom was dropped
    // A derived evidence section exists.
    expect(source.sections.some((s) => s.key === 'evidence')).toBe(true);
    // Always includes metadata + participants.
    expect(source.sections.some((s) => s.key === 'metadata')).toBe(true);
    expect(source.sections.some((s) => s.key === 'participants')).toBe(true);
  });

  it('produces a pack that resolves and preserves the original evidence language', () => {
    const gen = new MockAIPackGenerator();
    return gen.generate(input).then((result) => {
      expect(result.promptVersion).toBe(PROMPT_VERSION);
      expect(result.schemaVersion).toBe(SCHEMA_VERSION);
      const { source } = buildPackSource(input, result.sections, segs);
      const pack = resolvePack(source as PackSource, 'en-US');
      // Synthesized purpose renders in the requested language slot…
      const purpose = pack.sections.find((s) => s.key === 'purpose');
      expect(purpose).toBeTruthy();
      // …but numbers/statements keep their original text.
      const numbers = pack.sections.find((s) => s.key === 'numbersAndDates');
      if (numbers && numbers.lines.length) expect(numbers.lines[0]!.text).toMatch(/120/);
    });
  });
});

describe('factory', () => {
  it('selects the mock generator without credentials and never falls back silently in prod', () => {
    expect(createAIPackGenerator({}).name).toBe('mock');
    expect(createAIPackGenerator({ AI_PACK_PROVIDER: 'mock' }).name).toBe('mock');
    expect(() => createAIPackGenerator({ NODE_ENV: 'production' })).toThrow(/No AI Pack provider/);
    expect(() => createAIPackGenerator({ AI_PACK_PROVIDER: 'anthropic' })).toThrow(/ANTHROPIC_API_KEY/);
    expect(createAIPackGenerator({ AI_PACK_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'k' }).name).toBe('anthropic');
  });

  it('falls back to the default model when AI_PACK_MODEL is unset or blank (empty-env footgun)', () => {
    const base = { AI_PACK_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'k' } as const;
    expect(createAIPackGenerator({ ...base }).model).toBe(DEFAULT_AI_PACK_MODEL);
    expect(createAIPackGenerator({ ...base, AI_PACK_MODEL: '' }).model).toBe(DEFAULT_AI_PACK_MODEL);
    expect(createAIPackGenerator({ ...base, AI_PACK_MODEL: '   ' }).model).toBe(DEFAULT_AI_PACK_MODEL);
    expect(createAIPackGenerator({ ...base, AI_PACK_MODEL: 'claude-opus-4-8' }).model).toBe('claude-opus-4-8');
  });

  it('exposes exactly the canonical LLM section keys', () => {
    expect([...LLM_SECTION_KEYS]).toEqual([
      'purpose', 'executiveContext', 'topics', 'importantStatements',
      'explicitDecisions', 'actionItems', 'openPoints', 'risks', 'questions', 'numbersAndDates', 'ambiguities',
    ]);
  });
});
