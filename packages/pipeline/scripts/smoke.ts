/**
 * Live provider smoke checks (Milestones 3 & 4).
 *
 * These exercise the REAL R2, Deepgram and Anthropic providers. They are honest
 * about credentials: when the required secrets are absent, the check is reported
 * as `NOT RUN — credentials unavailable` and the script still exits 0. A check is
 * only ever `PASS` when a real round-trip actually succeeded, and `FAIL` on a
 * real error. Nothing here writes secrets to disk or logs.
 *
 * Run: pnpm --filter @loquia/pipeline smoke
 */
import { R2StorageAdapter } from '../src/adapters/r2-storage';
import { DeepgramTranscriptionAdapter } from '../src/adapters/deepgram-transcription';
import { LLMAIPackGenerator } from '../src/adapters/llm-ai-pack';
import { validateCandidate, LLM_SECTION_KEYS } from '../src/ai-pack-schema';
import { buildPackSource } from '../src/ai-pack-evidence';
import type { AIPackGenerationInput, GenSegment } from '../src/ai-pack';

type Status = 'PASS' | 'FAIL' | 'NOT RUN';
const results: { name: string; status: Status; detail?: string }[] = [];

function record(name: string, status: Status, detail?: string): void {
  results.push({ name, status, detail });
}

/** A minimal valid 8 kHz mono 16-bit PCM WAV of silence (~0.25 s). */
function silenceWav(): Uint8Array {
  const sampleRate = 8000;
  const samples = sampleRate / 4;
  const dataLen = samples * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataLen, 40);
  return new Uint8Array(buf);
}

async function smokeR2(): Promise<void> {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    record('R2 storage round-trip', 'NOT RUN', 'credentials unavailable');
    return;
  }
  try {
    const r2 = new R2StorageAdapter({
      accountId: R2_ACCOUNT_ID,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET_NAME,
    });
    const key = `smoke/${Date.now()}-${Math.round(Math.random() * 1e6)}.txt`;
    const body = new TextEncoder().encode('loquia-smoke');
    const up = await r2.createUploadUrl({ objectKey: key, contentType: 'text/plain', ttlSeconds: 120 });
    const put = await fetch(up.url, { method: 'PUT', headers: up.headers, body });
    if (!put.ok) throw new Error(`PUT ${put.status}`);
    const stat = await r2.headObject(key);
    if (!stat.exists || stat.sizeBytes !== body.byteLength) throw new Error('HEAD mismatch');
    const got = await r2.getObject(key);
    if (new TextDecoder().decode(got) !== 'loquia-smoke') throw new Error('GET mismatch');
    await r2.deleteObject(key);
    record('R2 storage round-trip', 'PASS', 'PUT → HEAD → GET → DELETE');
  } catch (err) {
    record('R2 storage round-trip', 'FAIL', err instanceof Error ? err.message : String(err));
  }
}

async function smokeDeepgram(): Promise<void> {
  if (!process.env.DEEPGRAM_API_KEY) {
    record('Deepgram transcription', 'NOT RUN', 'credentials unavailable');
    return;
  }
  try {
    const dg = new DeepgramTranscriptionAdapter({
      apiKey: process.env.DEEPGRAM_API_KEY,
      model: process.env.DEEPGRAM_MODEL,
    });
    const res = await dg.transcribe({ audio: silenceWav(), mimeType: 'audio/wav', diarize: true });
    // Silence yields few/no words; a successful call still returns a valid result.
    record('Deepgram transcription', 'PASS', `provider=${res.provider} model=${res.model ?? '?'}`);
  } catch (err) {
    record('Deepgram transcription', 'FAIL', err instanceof Error ? err.message : String(err));
  }
}

async function smokeAIPack(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    record('Anthropic AI Pack generation', 'NOT RUN', 'credentials unavailable');
    return;
  }
  try {
    const gen = new LLMAIPackGenerator({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.AI_PACK_MODEL ?? 'claude-sonnet-5',
      maxRetries: 1,
    });
    // Non-sensitive fixture transcript with explicit segment ids.
    const segments: GenSegment[] = [
      { id: 'seg1', speakerId: 'sp1', speakerLabel: 'Speaker 1', startSeconds: 0, endSeconds: 6, text: 'Good morning. Let us review the project status.' },
      { id: 'seg2', speakerId: 'sp2', speakerLabel: 'Speaker 2', startSeconds: 7, endSeconds: 15, text: 'The decision is to launch the pilot on March 3rd with a budget of $12,000.' },
      { id: 'seg3', speakerId: 'sp1', speakerLabel: 'Speaker 1', startSeconds: 16, endSeconds: 22, text: 'Can we confirm the vendor by Friday?' },
    ];
    const input: AIPackGenerationInput = {
      meeting: { id: 'smoke-m', workspaceId: 'smoke-w', title: 'Smoke meeting', language: 'en-US', source: 'upload', durationSeconds: 22 },
      participants: [{ name: 'Speaker 1' }, { name: 'Speaker 2' }],
      transcript: segments,
      outputLanguage: 'en-US',
    };
    const result = await gen.generate(input);
    // Every produced section key must be canonical, and evidence must resolve.
    const badKey = result.sections.find((s) => !LLM_SECTION_KEYS.includes(s.key as (typeof LLM_SECTION_KEYS)[number]));
    if (badKey) throw new Error(`non-canonical section: ${badKey.key}`);
    if (!validateCandidate({ sections: result.sections }).ok) throw new Error('result failed schema validation');
    const { stats } = buildPackSource(input, result.sections, segments);
    record('Anthropic AI Pack generation', 'PASS', `model=${result.model} sections=${result.sections.length} cited=${stats.citedSegments} dropped=${stats.droppedFacts}`);
  } catch (err) {
    record('Anthropic AI Pack generation', 'FAIL', err instanceof Error ? err.message : String(err));
  }
}

async function main(): Promise<void> {
  await smokeR2();
  await smokeDeepgram();
  await smokeAIPack();

  // eslint-disable-next-line no-console
  console.log('\nLive provider smokes (Milestones 3 & 4)\n');
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(`  ${r.status.padEnd(8)} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  const failed = results.filter((r) => r.status === 'FAIL');
  // NOT RUN is not a failure; only real FAILs fail the script.
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('smoke crashed', err);
  process.exit(1);
});
