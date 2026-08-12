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
 * Messages API — no SDK, mirroring the Deepgram adapter — using structured
 * output (`output_config.format`) so the model returns schema-shaped JSON, which
 * is then re-validated with Zod (never trusted raw). Long transcripts are
 * chunked deterministically and consolidated. Invalid output is retried a
 * bounded number of times with schema feedback.
 */
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
    this.maxTokens = config.maxTokens ?? 8000;
    this.timeoutMs = config.timeoutMs ?? 120_000;
    this.baseUrl = config.baseUrl ?? 'https://api.anthropic.com';
  }

  async generate(input: AIPackGenerationInput): Promise<AIPackGenerationResult> {
    const chunks = chunkTranscript(input.transcript);
    const partials: GeneratedSection[][] = [];
    let inputTokens = 0;
    let outputTokens = 0;
    let requestCount = 0;

    for (const chunk of chunks.length ? chunks : [[]]) {
      const { sections, usage } = await this.generateChunk({ ...input, transcript: chunk });
      partials.push(sections);
      inputTokens += usage.inputTokens;
      outputTokens += usage.outputTokens;
      requestCount += usage.requestCount;
    }

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
    const prompt = buildAIPackPrompt(input);
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
      const text = (res.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        lastError = 'response was not valid JSON';
        messages.push({ role: 'assistant', content: text });
        messages.push({ role: 'user', content: 'Your previous response was not valid JSON. Return only a JSON object matching the schema.' });
        continue;
      }
      const validation = validateCandidate(parsed);
      if (validation.ok && validation.value) {
        return { sections: validation.value.sections as GeneratedSection[], usage };
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
          system,
          messages,
          output_config: { format: { type: 'json_schema', schema: CANDIDATE_JSON_SCHEMA } },
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
      if (res.status === 429) throw new PipelineError('provider_5xx', 'AI Pack provider rate limited');
      if (res.status >= 500) throw new PipelineError('provider_5xx', `AI Pack provider ${res.status}`);
      throw new PipelineError('provider_rejected', `AI Pack provider ${res.status}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as AnthropicMessage;
  }
}
