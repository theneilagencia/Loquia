import { describe, expect, it } from 'vitest';
import { isAcceptedAudioMime } from './media-format';
import { segmentTranscription } from './segmentation';
import { PipelineError, isRetryable } from './errors';
import { MockTranscriptionAdapter } from './adapters/mock-transcription';
import { createTranscriptionProvider } from './factory';
import type { TranscriptionWord } from './transcription';

describe('accepted audio MIME (M5.2)', () => {
  it('accepts audio types (with codecs) and rejects others', () => {
    expect(isAcceptedAudioMime('audio/webm;codecs=opus')).toBe(true);
    expect(isAcceptedAudioMime('audio/wav')).toBe(true);
    expect(isAcceptedAudioMime('audio/mpeg')).toBe(true);
    expect(isAcceptedAudioMime('application/zip')).toBe(false);
    expect(isAcceptedAudioMime('text/plain')).toBe(false);
  });
});

describe('segmentation', () => {
  const words = (spec: [number, string, number, number][]): TranscriptionWord[] =>
    spec.map(([speaker, text, startMs, endMs]) => ({ speaker, text, startMs, endMs, providerSpeaker: speaker, confidence: 0.9 } as unknown as TranscriptionWord));

  it('starts a new segment on speaker change and maps stable speaker keys/labels', () => {
    const result = segmentTranscription(
      words([
        [0, 'Hello.', 0, 300],
        [0, 'World.', 350, 700],
        [1, 'Hi.', 800, 1100],
      ]),
    );
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]!.speakerKey).toBe('sp1');
    expect(result.segments[1]!.speakerKey).toBe('sp2');
    expect(result.speakers.map((s) => s.label)).toEqual(['Speaker 1', 'Speaker 2']);
    expect(result.segments[0]!.text).toBe('Hello. World.');
    expect(result.segments[0]!.sequence).toBe(0);
  });

  it('splits on a long pause between words of the same speaker', () => {
    const result = segmentTranscription(
      words([
        [0, 'One.', 0, 300],
        [0, 'Two.', 5000, 5300],
      ]),
      { maxGapMs: 1200, maxSegmentMs: 15000, maxWords: 60 },
    );
    expect(result.segments).toHaveLength(2);
  });

  it('never emits one segment per word for normal speech', () => {
    const result = segmentTranscription(
      words([
        [0, 'a', 0, 100],
        [0, 'b', 120, 220],
        [0, 'c.', 240, 340],
      ]),
    );
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]!.wordCount).toBe(3);
  });
});

describe('retry classification', () => {
  it('marks transient categories retryable and permanent ones not', () => {
    expect(isRetryable(new PipelineError('network', 'x'))).toBe(true);
    expect(isRetryable(new PipelineError('provider_5xx', 'x'))).toBe(true);
    expect(isRetryable(new PipelineError('unsupported_media', 'x'))).toBe(false);
    expect(isRetryable(new PipelineError('authorization', 'x'))).toBe(false);
    expect(isRetryable(new Error('plain'))).toBe(false);
  });
});

describe('mock transcription → segmentation', () => {
  it('produces diarized words that segment into a readable transcript', async () => {
    const provider = new MockTranscriptionAdapter();
    const result = await provider.transcribe({ mimeType: 'audio/webm', diarize: true, languageHint: 'pt-BR' });
    expect(result.words.length).toBeGreaterThan(10);
    const segmented = segmentTranscription(result.words);
    expect(segmented.speakers.length).toBe(2);
    expect(segmented.segments.length).toBeGreaterThanOrEqual(4);
  });
});

describe('provider factory (no silent prod fallback)', () => {
  it('defaults to mock in dev but throws in production without config', () => {
    expect(createTranscriptionProvider({ NODE_ENV: 'development' }).name).toBe('mock');
    expect(() => createTranscriptionProvider({ NODE_ENV: 'production' })).toThrow();
  });

  it('throws when a real provider is selected but misconfigured', () => {
    expect(() => createTranscriptionProvider({ TRANSCRIPTION_PROVIDER: 'deepgram' })).toThrow();
  });
});
