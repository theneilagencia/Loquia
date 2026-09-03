import { PipelineError } from '../errors';
import type {
  AIPackGenerationInput,
  AIPackGenerationResult,
  AIPackGenerator,
  GeneratedSection,
} from '../ai-pack';
import { buildAIPackPrompt, PROMPT_VERSION } from '../ai-pack-prompt';
import { CANDIDATE_JSON_SCHEMA, SCHEMA_VERSION, validateCandidate } from '../ai-pack-schema';
import { chunkTranscript } from '../ai-pack-chunk';
import { consolidateSections } from '../ai-pack-consolidate';

/**
 * Anthropic-backed AI Pack generator (Milestone 4). A typed HTTP client for the
 * Messages API — no SDK, mirroring the Deepgram adapter. The JSON shape is
 * enforced by INSTRUCTION: the system prompt carries an explicit "return only
 * JSON" directive plus the canonical JSON Schema, and the response is re-parsed
 * and re-validated with Zod (never trusted raw). Long transcripts are chunked
 * deterministically and consolidated. Invalid output is retried a bounded number
 * of times with schema feedback.
 *
 * NOTE: the Anthropic Messages API has no `output_config`/`response_format`
 * parameter — sending one is silently ignored, which previously left the model
 * with no schema at all and produced malformed, nonsensical packs. The schema
 * now lives in the prompt where the model actually reads it.
 */

/** Explicit output contract appended to the system prompt (the schema the model must follow). */
function jsonFormatDirective(): string {
  return [
    '',
    'OUTPUT FORMAT — READ CAREFULLY:',
    'Respond with ONLY a single JSON object and nothing else — no prose before or after, no explanation, no markdown code fences.',
    'The object MUST conform EXACTLY to this JSON Schema:',
    JSON.stringify(CANDIDATE_JSON_SCHEMA),
    'Shape rules:',
    '- Top level is { "sections": [ ... ] }.',
    '- Each section is { "key": <one of the allowed keys>, "facts": [ ... ] } and nothing else.',
    '- Each fact is { "text": <concise synthesized statement>, "classification": "explicit" | "inferred" | "uncertain", "segmentIds": [<SEGMENT ids that support it>] } and nothing else.',
    '- Use only the section keys allowed by the schema. Omit a section (or give it an empty "facts" array) when it has no supported content.',
    'Return the JSON object now.',
  ].join('\n');
}

/**
 * Pull the JSON object out of a model reply — tolerant of stray prose or
 * ```json code fences the model may add despite instructions.
 */
export function extractJsonObject(text: string): string {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) t = fence[1].trim();
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first >= 0 && last > first) t = t.slice(first, last + 1);
  return t;
}
export interface LLMAIPackConfig {
  apiKey: string;
  model: string;
  maxRetries?: number;
  maxTokens?: number;
  timeoutMs?: number;
  baseUrl?: string;
}

interface AnthropicMessage {
  stop_reason?: string;
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

export class LLMAIPackGenerator implements AIPackGenerator {
  readonly name = 'anthropic';
  readonly model: string;
  private readonly maxRetries: number;
  private readonly maxTokens: number;
  private readonly timeoutMs: number;
  private readonly baseUrl: string;

  constructor(private readonly config: LLMAIPackConfig) {
    this.model = config.model;
    this.maxRetries = Math.max(0, config.maxRetries ?? 2);
    // Generous output budget so a chunk's JSON is never truncated at the limit
    // (truncation broke JSON parsing and triggered slow retries → apparent hang).
    this.maxTokens = config.maxTokens ?? 16_000;
    this.timeoutMs = config.timeoutMs ?? 120_000;
    this.baseUrl = config.baseUrl ?? 'https://api.anthropic.com';
  }

  async generate(input: AIPackGenerationInput): Promise<AIPackGenerationResult> {
    const chunks = chunkTranscript(input.transcript);
    const list = chunks.length ? chunks : [[]];

    // Generate chunks with bounded concurrency so a long meeting finishes in
    // seconds instead of minutes of serial calls (the cause of the "hang").
    const CONCURRENCY = 4;
    const results = new Array<{ sections: GeneratedSection[]; usage: { inputTokens: number; outputTokens: number; requestCount: number } }>(list.length);
    let cursor = 0;
    const worker = async (): Promise<void> => {
      for (let i = cursor++; i < list.length; i = cursor++) {
        results[i] = await this.generateChunk({ ...input, transcript: list[i]! });
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, list.length) }, () => worker()));

    const partials = results.map((r) => r.sections);
    const inputTokens = results.reduce((a, r) => a + r.usage.inputTokens, 0);
    const outputTokens = results.reduce((a, r) => a + r.usage.outputTokens, 0);
    const requestCount = results.reduce((a, r) => a + r.usage.requestCount, 0);

    return {
      sections: consolidateSections(partials),
      outputLanguage: input.outputLanguage,
      provider: this.name,
      model: this.model,
      promptVersion: PROMPT_VERSION,
      schemaVersion: SCHEMA_VERSION,
      usage: { inputTokens, outputTokens, requestCount },
    };
  }

  private async generateChunk(
    input: AIPackGenerationInput,
  ): Promise<{ sections: GeneratedSection[]; usage: { inputTokens: number; outputTokens: number; requestCount: number } }> {
    // Show the model SHORT, echo-able segment ids (s0, s1, …) instead of the raw
    // UUIDs — models cannot reproduce long random UUIDs verbatim, so citing them
    // failed and evidence resolution dropped every fact, yielding an empty pack.
    // We translate the model's citations back to the real ids before returning.
    const realIdByShort = new Map<string, string>();
    const shortTranscript = input.transcript.map((seg, i) => {
      const short = `s${i}`;
      realIdByShort.set(short, seg.id);
      return { ...seg, id: short };
    });
    const prompt = buildAIPackPrompt({ ...input, transcript: shortTranscript });
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: prompt.user },
    ];
    let usage = { inputTokens: 0, outputTokens: 0, requestCount: 0 };
    let lastError = 'no response';

    // Structured-output retry loop (task §32): validate, then retry with feedback.
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const res = await this.call(prompt.system, messages);
      usage = {
        inputTokens: usage.inputTokens + (res.usage?.input_tokens ?? 0),
        outputTokens: usage.outputTokens + (res.usage?.output_tokens ?? 0),
        requestCount: usage.requestCount + 1,
      };
      if (res.stop_reason === 'refusal') {
        throw new PipelineError('provider_rejected', 'AI Pack generation was refused by the provider');
      }
      // A truncated response (hit the token limit) yields invalid JSON; retrying
      // the same prompt just truncates again, so fail fast instead of hanging.
      if (res.stop_reason === 'max_tokens') {
        throw new PipelineError('provider_rejected', 'AI Pack response exceeded the output token budget (transcript chunk too large)');
      }
      const text = (res.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJsonObject(text));
      } catch {
        lastError = 'response was not valid JSON';
        messages.push({ role: 'assistant', content: text });
        messages.push({ role: 'user', content: 'Your previous response was not valid JSON. Return only a JSON object matching the schema.' });
        continue;
      }
      const validation = validateCandidate(parsed);
      if (validation.ok && validation.value) {
        // Translate the model's short ids (s0, s1, …) back to the real segment
        // ids so evidence resolution matches this meeting's segments.
        const sections = validation.value.sections.map((section) => ({
          ...section,
          facts: section.facts.map((fact) => ({
            ...fact,
            segmentIds: fact.segmentIds.map((id) => realIdByShort.get(id)).filter((id): id is string => Boolean(id)),
          })),
        }));
        return { sections: sections as GeneratedSection[], usage };
      }
      lastError = validation.error ?? 'schema validation failed';
      messages.push({ role: 'assistant', content: text });
      messages.push({ role: 'user', content: `The JSON did not match the schema: ${lastError}. Fix it and return only the corrected JSON object.` });
    }
    // Persistent schema failure is a permanent error (task §31 — no infinite retry).
    throw new PipelineError('provider_rejected', `AI Pack output failed schema validation: ${lastError}`);
  }

  private async call(system: string, messages: Array<{ role: string; content: string }>): Promise<AnthropicMessage> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          // The schema is delivered in the prompt (Anthropic has no output_config);
          // this is where the model actually learns the required JSON shape.
          system: `${system}\n${jsonFormatDirective()}`,
          messages,
        }),
      });
    } catch (err) {
      clearTimeout(timer);
      if ((err as Error).name === 'AbortError') throw new PipelineError('provider_timeout', 'AI Pack request timed out', err);
      throw new PipelineError('network', 'AI Pack request failed', err);
    }
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (res.status === 401 || res.status === 403) throw new PipelineError('authorization', 'AI Pack provider authorization failed');
      // Out of credits / billing blocked — a 400 the provider returns when the
      // account balance is too low. Non-retryable and needs a human to add credits,
      // so classify it distinctly instead of a generic rejection.
      if (/credit balance is too low|purchase credits|billing|insufficient/i.test(body)) {
        throw new PipelineError('provider_credits', 'AI Pack provider: credit balance too low');
      }
      if (res.status === 429) throw new PipelineError('provider_5xx', 'AI Pack provider rate limited');
      if (res.status >= 500) throw new PipelineError('provider_5xx', `AI Pack provider ${res.status}`);
      throw new PipelineError('provider_rejected', `AI Pack provider ${res.status}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as AnthropicMessage;
  }
}
