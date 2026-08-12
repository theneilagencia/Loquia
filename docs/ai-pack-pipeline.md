# Loquia — AI Pack Generation (Milestone 4)

Milestone 4 turns a persisted transcript into a **real, structured AI Pack**:

```
TranscriptSegment[]
  → AIPackGenerator (provider-neutral)
  → structured candidate (JSON, schema-constrained)
  → schema validation (Zod)
  → evidence validation (segment ids resolved from the DB)
  → AIPack persisted (versioned; one current per meeting)
  → frontend (honest states)
  → ExportEngine (Markdown / TXT / JSON)
```

The AI Pack is **never** `Transcript → LLM → Markdown`. Markdown is only ever a
render of the canonical, validated pack.

## Provider abstraction

`AIPackGenerator` (`packages/pipeline/src/ai-pack.ts`) is the only thing the
worker talks to. It takes a provider-neutral `AIPackGenerationInput`
(meeting + participants + transcript segments + output language) and returns a
provider-neutral `AIPackGenerationResult` (structured `sections` of classified
facts + provider/model/prompt/schema metadata). The concrete provider name never
reaches the domain, the API, or the UI.

- **`LLMAIPackGenerator`** — a typed `fetch` client for the Anthropic Messages
  API (no SDK), using **structured output** (`output_config.format` with a JSON
  schema) so the model returns schema-shaped JSON, which is then **re-validated
  with Zod** (never trusted raw). Long transcripts are chunked and consolidated.
- **`MockAIPackGenerator`** — deterministic, derives sections from the real input
  segments (every cited id is valid), so the whole pipeline runs in dev/tests
  without an API call.

Selection is env-driven (`createAIPackGenerator`): `AI_PACK_PROVIDER=anthropic`
requires `ANTHROPIC_API_KEY`; `mock` is allowed but must be **explicit** in
production. **Production never silently falls back to the mock.**

| Env | Meaning | Default |
| --- | --- | --- |
| `AI_PACK_PROVIDER` | `anthropic` \| `mock` | `anthropic` if `ANTHROPIC_API_KEY` set, else `mock` (dev only) |
| `AI_PACK_MODEL` | model id | `claude-sonnet-5` |
| `AI_PACK_MAX_RETRIES` | structured-output retries | 2 |
| `ANTHROPIC_API_KEY` | provider secret | — |

## Structured output + schema versioning

The canonical schema (`ai-pack-schema.ts`, `SCHEMA_VERSION`) constrains the model
to exactly the synthesizable canonical sections — `purpose`, `executiveContext`,
`topics`, `importantStatements`, `explicitDecisions`, `openPoints`, `questions`,
`numbersAndDates`, `ambiguities` — it can never invent a section outside this
set. `metadata`/`participants` are derived from meeting data (never the LLM), and
`instructions`/`evidence`/`transcript` are produced by the export engine. Each
fact carries a `classification` (`explicit` / `inferred` / `uncertain`) and the
`segmentIds` that support it.

Invalid output is retried up to `AI_PACK_MAX_RETRIES` with schema feedback; a
persistent schema failure is a **permanent** error (no infinite retry). A
provider refusal is permanent too. Transient failures (network, timeout, 5xx,
rate limit) are retryable and re-queued by BullMQ.

## Prompt versioning

`buildAIPackPrompt` (`ai-pack-prompt.ts`, `PROMPT_VERSION`) is the single home
for prompt text — system rules (don't invent, separate explicit from inferred,
cite segment ids, preserve numbers/dates, don't reconstruct quotes), meeting
metadata, participant context, an **ID-tagged transcript** (`SEGMENT <id>` …),
and the output-language rule. `generatorProvider`, `generatorModel`,
`promptVersion`, `schemaVersion`, `outputLanguage` and `generatedAt` are
persisted per version for reproduction.

## Evidence strategy — timestamps come from segments, not the LLM

The LLM returns `segmentIds`; the application resolves the authoritative
timestamp, speaker and excerpt from the real `TranscriptSegment`s
(`ai-pack-evidence.ts`). Rules (docs/ai-pack-spec.md §9–§13, §19–§23):

- **Referential integrity**: a cited id must exist and belong to the same meeting
  (and thus workspace). Ids that don't resolve are **hallucinations → rejected**;
  a fact whose evidence was entirely hallucinated is dropped and counted.
- **Timestamps are never taken from the model** — `atSeconds` is the earliest
  cited segment's start.
- **Important statements and evidence show the ORIGINAL segment text**, never a
  reconstructed quote.
- **Numbers and dates** are preserved exactly.
- **Ambiguities** are recorded, not resolved.

The result is persisted as a `PackSource` (the same JSONB shape M2/M3 used), so
`resolvePack`, `AIPackView` and the export engine keep working unchanged;
richer evidence fields (`segmentIds`, `speakerId`, `classification`) are additive.

## Chunking & consolidation (long transcripts)

`chunkTranscript` groups whole segments (never splits one) into ordered,
character-budgeted chunks with optional overlap — deterministic and unit-tested.
Each chunk is extracted independently, then `consolidateSections` merges partial
results: dedup by normalized fact text within a section, **union** the evidence
segment ids, preserve divergences, and keep the **most cautious** classification
(inferred never becomes explicit).

## Async job, idempotency, retries

AI Pack generation runs as its own `ProcessingJob` (`type: 'ai_pack'`), never in
an HTTP request. After a transcript completes the worker enqueues the ai_pack job
(`docs/processing-jobs.md`). The worker:

1. claims the job (guards re-delivery),
2. sets `meeting.aiPackStatus = 'generating'`,
3. loads segments, generates, validates schema + evidence,
4. persists a new version and marks the job/meeting.

**Idempotency**: `ai_packs.generation_key` is unique per meeting — a retried job
that already wrote its version does nothing, so there is never more than one
`current` version. **Failure** leaves the transcript (and any current pack)
intact and sets `aiPackStatus = 'failed'`.

## Versioning & regeneration

Each generation is an immutable `ai_packs` row with a `version` and an
`isCurrent` flag (partial unique index: exactly one current per meeting). The
worker flips `isCurrent` only inside the final persist transaction, so a
**regeneration keeps the old version visible until the new one succeeds** — the
UI never shows an empty pack mid-regeneration. History is retained.

## Frontend states

The meeting detail page polls `GET /meetings/:id/ai-pack/status` and reflects the
real state honestly: `not_started` (Generate button), `queued`/`generating`
(progress text), `ready` (the pack in the existing `AIPackView` + a Regenerate
button), `failed` (message + retry). Evidence timestamps still seek the audio and
keep their original language. The export engine consumes the current real pack
automatically; Clean Transcript works even if generation failed.

## Live smoke

`pnpm --filter @loquia/pipeline smoke` runs a real Anthropic generation over a
non-sensitive fixture when `ANTHROPIC_API_KEY` is set, checking structured
output, 14-section compatibility, and segment-id evidence resolution. Without the
key it reports **`NOT RUN — credentials unavailable`** — never a false PASS.

## Privacy

Only what is needed to generate the pack is sent to the provider (meeting title,
participant labels, transcript). Session tokens, passwords, admin/billing
metadata, workspace secrets and unrelated meetings are never included. Logs use
IDs and counts — never transcript text, prompt bodies, or pack content.
