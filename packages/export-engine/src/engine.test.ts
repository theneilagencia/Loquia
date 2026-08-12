import { describe, expect, it } from 'vitest';
import { runExport, formatTimestamp, speakerName } from './engine';
import { makeAIPack, makeMeeting, makeTranscript } from './fixtures';
import type { ExportInput } from './engine';
import type { ExportOptions } from '@loquia/domain';

function input(over?: Partial<ExportInput>): ExportInput {
  return {
    meeting: makeMeeting(),
    aiPack: makeAIPack(),
    transcript: makeTranscript(),
    ...over,
  };
}

const base: ExportOptions = {
  preset: 'ai_pack',
  size: 'standard',
  format: 'md',
  language: 'en-US',
  includeEvidence: true,
};

describe('formatTimestamp', () => {
  it('formats mm:ss and hh:mm:ss', () => {
    expect(formatTimestamp(0)).toBe('00:00');
    expect(formatTimestamp(65)).toBe('01:05');
    expect(formatTimestamp(3661)).toBe('01:01:01');
  });
});

describe('speakerName', () => {
  it('prefers displayName, falls back to diarization label', () => {
    expect(speakerName({ id: 's', diarizationLabel: 'Speaker 1', color: '#000' })).toBe('Speaker 1');
    expect(
      speakerName({ id: 's', diarizationLabel: 'Speaker 1', displayName: 'Ana', color: '#000' }),
    ).toBe('Ana');
  });
});

describe('runExport — JSON', () => {
  it('produces valid parseable JSON', () => {
    const res = runExport(input(), { ...base, format: 'json' });
    expect(res.format).toBe('json');
    expect(res.mimeType).toContain('application/json');
    const parsed = JSON.parse(res.content);
    expect(parsed.meeting.title).toBe('Roadmap Q3');
    expect(Array.isArray(parsed.aiPack)).toBe(true);
  });

  it('keeps evidence in its original language', () => {
    const res = runExport(input(), { ...base, format: 'json', includeEvidence: true });
    const parsed = JSON.parse(res.content);
    const overview = parsed.aiPack.find((s: { key: string }) => s.key === 'overview');
    expect(overview.items[0].evidence[0].language).toBe('pt-BR');
    expect(overview.items[0].evidence[0].quote).toContain('roadmap do trimestre');
  });
});

describe('runExport — Markdown', () => {
  it('renders AI Pack section headings for the export language', () => {
    const res = runExport(input(), { ...base, format: 'md', language: 'en-US' });
    expect(res.content).toContain('## AI Pack');
    expect(res.content).toContain('### Overview');
    expect(res.content).toContain('### Metrics');
  });

  it('localizes headings to Portuguese', () => {
    const res = runExport(input(), { ...base, format: 'md', language: 'pt-BR' });
    expect(res.content).toContain('### Resumo executivo');
  });

  it('never renders empty sections', () => {
    const res = runExport(input(), { ...base, format: 'md' });
    expect(res.content).not.toContain('Glossary');
    expect(res.content).not.toContain('Glossário');
  });

  it('flags inferred and uncertain items', () => {
    const res = runExport(input(), { ...base, format: 'md', size: 'full' });
    expect(res.content).toContain('_inferred_');
    expect(res.content).toContain('_uncertain_');
  });
});

describe('presets', () => {
  it('clean_transcript emits transcript and no AI Pack', () => {
    const res = runExport(input(), { ...base, preset: 'clean_transcript', format: 'md' });
    expect(res.content).toContain('## Transcript');
    expect(res.content).not.toContain('## AI Pack');
  });

  it('full_fidelity includes transcript, timestamps and evidence', () => {
    const res = runExport(input(), { ...base, preset: 'full_fidelity', format: 'md' });
    expect(res.content).toContain('## AI Pack');
    expect(res.content).toContain('## Transcript');
    expect(res.content).toMatch(/\[00:00\]/);
    expect(res.content).toContain('Evidence');
  });

  it('custom preset honours explicit section selection in canonical order', () => {
    const res = runExport(input(), {
      ...base,
      preset: 'custom',
      sections: ['metrics', 'overview'],
      format: 'md',
    });
    const overviewIdx = res.content.indexOf('Overview');
    const metricsIdx = res.content.indexOf('Metrics');
    expect(overviewIdx).toBeGreaterThan(-1);
    expect(metricsIdx).toBeGreaterThan(-1);
    // Overview comes before Metrics in canonical order.
    expect(overviewIdx).toBeLessThan(metricsIdx);
  });
});

describe('sizes', () => {
  it('compact drops inferred items', () => {
    const res = runExport(input(), { ...base, size: 'compact', format: 'md', preset: 'full_fidelity' });
    // The only inferred item is the risk; risks section should disappear.
    expect(res.content).not.toContain('### Risks');
  });

  it('full keeps inferred items', () => {
    const res = runExport(input(), { ...base, size: 'full', format: 'md', preset: 'full_fidelity' });
    expect(res.content).toContain('### Risks');
  });
});

describe('speaker rename propagation', () => {
  it('renamed speaker appears in transcript export', () => {
    const transcript = makeTranscript();
    const s1 = transcript.speakers.find((s) => s.id === 'sp1');
    if (s1) s1.displayName = 'Rafael';
    const res = runExport(input({ transcript }), {
      ...base,
      preset: 'full_fidelity',
      format: 'txt',
    });
    expect(res.content).toContain('Rafael:');
    expect(res.content).not.toContain('Speaker 1:');
  });
});

describe('filename + bytes', () => {
  it('builds a slugged filename and byte count', () => {
    const res = runExport(input(), { ...base, format: 'json' });
    expect(res.filename).toBe('roadmap-q3-ai_pack-standard.json');
    expect(res.bytes).toBeGreaterThan(0);
  });
});
