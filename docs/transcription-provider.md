# Loquia — Transcription Provider (Milestone 3)

Speech-to-text and diarization sit behind the `TranscriptionProvider` interface
(`packages/pipeline/src/transcription.ts`). The domain works with
provider-neutral **words** (text + `startMs`/`endMs` + optional `confidence` +
raw `providerSpeaker` index) — never a provider-specific payload and never a
human identity.

## Interface

```ts
interface TranscriptionProvider {
  readonly name: string;
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
}
```

`TranscriptionInput` prefers a short-lived `audioUrl` the provider fetches
directly (bucket stays private); the mock accepts raw `audio` bytes too. It
carries a BCP-47 `languageHint` (or omitted for auto-detect) and `diarize`.

`TranscriptionResult` returns `words`, `detectedLanguage`, `provider`,
`providerRequestId`, `model`, and `durationMs` — the metadata persisted on the
`ProcessingJob` for audit/metrics.

## Adapters

- **`DeepgramTranscriptionAdapter`** — a typed `fetch` client for Deepgram's
  pre-recorded API (Nova family, `DEEPGRAM_MODEL`, default `nova-2`), with
  `diarize=true`, word-level timestamps, and `detect_language`/language hint. The
  response is mapped to neutral `TranscriptionWord[]` (utterance/word speaker →
  `providerSpeaker`). No Deepgram type leaks upward.
- **`MockTranscriptionAdapter`** — deterministic two-speaker dialogue (pt-BR and
  en-US) with real millisecond timestamps, so segmentation, diarization mapping,
  and persistence are all exercised without an external call.

## Selection (no silent prod fallback)

`createTranscriptionProvider(env)`:

- `TRANSCRIPTION_PROVIDER=deepgram` → requires `DEEPGRAM_API_KEY` (throws if
  missing).
- `TRANSCRIPTION_PROVIDER=mock` → mock (must be **explicit** in production).
- unset → `deepgram` if `DEEPGRAM_API_KEY` is present, else `mock` in dev; an
  unset/implicit provider in production **throws** rather than degrade to mock.

## Diarization → neutral labels

Provider speaker indices (`0, 1, …`) become stable per-meeting keys
(`sp1, sp2, …`) with technical labels `Speaker 1`, `Speaker 2`, …. Users can
rename speakers; the stable key never changes, so evidence references remain
valid. See `docs/media-pipeline.md` for segmentation rules.

## Language

The meeting's `meetingLanguage` is passed as the hint (unless `auto`). The
provider's `detectedLanguage` is stored on the meeting (`detectedLanguage`) and
on each segment.

## Live smoke

A real Deepgram transcription is only run when `DEEPGRAM_API_KEY` is configured.
Without it, the smoke is reported **`NOT RUN — credentials unavailable`** — never
falsely PASS.
