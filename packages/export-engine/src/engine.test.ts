import { describe, expect, it } from 'vitest';
import { runExport, buildFilename, formatTimestamp } from './engine';
import { makeInput, makePack } from './fixtures';
import type { ExportConfig, ExportSections } from '@loquia/domain';

const allOn: ExportSections = { instructions: false, transcript: false, evidence: true, ambiguities: true };

function cfg(over?: Partial<ExportConfig>): ExportConfig {
  return {
    meetingId: 'm1',
    preset: 'ai',
    size: 'standard',
    format: 'md',
    sections: allOn,
    outputLanguage: 'en-US',
    ...over,
  };
}

describe('formatTimestamp', () => {
  it('formats mm:ss', () => {
    expect(formatTimestamp(0)).toBe('00:00');
    expect(formatTimestamp(252)).toBe('04:12');
    expect(formatTimestamp(1122)).toBe('18:42');
  });
});

describe('canonical section titles + order (Markdown)', () => {
  it('emits English canonical headers in canonical order', () => {
    const md = runExport(makeInput(), cfg()).content;
    for (const h of ['# Meeting', '# Participants', '# Meeting purpose', '# Topics', '# Explicit decisions', '# Open points']) {
      expect(md).toContain(h);
    }
    expect(md.indexOf('# Meeting purpose')).toBeLessThan(md.indexOf('# Topics'));
    expect(md.indexOf('# Explicit decisions')).toBeLessThan(md.indexOf('# Open points'));
  });
});

describe('evidence language rule', () => {
  it('important statements keep the original spoken language even when exporting in English', () => {
    const md = runExport(makeInput(), cfg({ format: 'md', outputLanguage: 'en-US' })).content;
    expect(md).toContain('# Important statements');
    expect(md).toContain('Sem a integração'); // pt-BR quote preserved
  });
});

describe('presets', () => {
  it('transcript preset is transcript-only', () => {
    const md = runExport(makeInput(), cfg({ preset: 'transcript', format: 'md' })).content;
    expect(md).toContain('# Full transcript');
    expect(md).not.toContain('# Explicit decisions');
  });
  it('full preset includes the transcript', () => {
    const md = runExport(makeInput(), cfg({ preset: 'full', format: 'md' })).content;
    expect(md).toContain('# Explicit decisions');
    expect(md).toContain('# Full transcript');
  });
  it('analysis preset includes the transcript', () => {
    const md = runExport(makeInput(), cfg({ preset: 'analysis', format: 'md' })).content;
    expect(md).toContain('# Full transcript');
  });
});

describe('sizes', () => {
  it('compact removes Questions raised and Numbers and dates', () => {
    const md = runExport(makeInput(), cfg({ size: 'compact', format: 'md' })).content;
    expect(md).not.toContain('# Questions raised');
    expect(md).not.toContain('# Numbers and dates');
  });
  it('standard keeps them', () => {
    const md = runExport(makeInput(), cfg({ size: 'standard', format: 'md' })).content;
    expect(md).toContain('# Questions raised');
    expect(md).toContain('# Numbers and dates');
  });
});

describe('section toggles', () => {
  it('evidence off removes Important statements', () => {
    const md = runExport(
      makeInput(),
      cfg({ sections: { ...allOn, evidence: false }, format: 'md' }),
    ).content;
    expect(md).not.toContain('# Important statements');
  });
  it('ambiguities off removes Ambiguities', () => {
    const md = runExport(
      makeInput(),
      cfg({ sections: { ...allOn, ambiguities: false }, format: 'md' }),
    ).content;
    expect(md).not.toContain('# Ambiguities');
  });
  it('instructions on prepends the instruction block', () => {
    const md = runExport(
      makeInput(),
      cfg({ sections: { ...allOn, instructions: true }, format: 'md' }),
    ).content;
    expect(md.startsWith('# Instructions for the AI')).toBe(true);
  });
});

describe('required empty sections show the negative phrase', () => {
  it('empty explicit decisions renders "No explicit decisions."', () => {
    const pack = makePack('en-US');
    pack.sections.find((s) => s.key === 'explicitDecisions')!.lines = [];
    const md = runExport(makeInput({ pack }), cfg({ format: 'md' })).content;
    expect(md).toContain('# Explicit decisions');
    expect(md).toContain('No explicit decisions.');
  });
  it('uses the Portuguese phrase for a pt output pack', () => {
    const pack = makePack('pt-BR');
    pack.sections.find((s) => s.key === 'openPoints')!.lines = [];
    const md = runExport(makeInput({ pack }), cfg({ format: 'md', outputLanguage: 'pt-BR' })).content;
    expect(md).toContain('Nenhum ponto aberto.');
  });
});

describe('JSON', () => {
  it('is valid and uses the canonical keys', () => {
    const res = runExport(makeInput(), cfg({ format: 'json' }));
    const parsed = JSON.parse(res.content);
    expect(parsed.meeting.title).toBe('Commercial meeting with Atlas');
    expect(Array.isArray(parsed.participants)).toBe(true);
    expect(parsed.context.purpose).toContain('pilot');
    for (const k of ['topics', 'important_statements', 'decisions', 'open_points', 'questions', 'numbers_and_dates', 'ambiguities', 'transcript']) {
      expect(k in parsed).toBe(true);
    }
  });
  it('skipped sections become empty arrays, not absent', () => {
    const res = runExport(makeInput(), cfg({ format: 'json', size: 'compact' }));
    const parsed = JSON.parse(res.content);
    expect(parsed.questions).toEqual([]);
    expect(parsed.numbers_and_dates).toEqual([]);
  });
  it('important_statements carry timestamp + text', () => {
    const res = runExport(makeInput(), cfg({ format: 'json' }));
    const parsed = JSON.parse(res.content);
    expect(parsed.important_statements[0].timestamp).toBe('18:42');
    expect(parsed.important_statements[0].text).toContain('Sem a integração');
  });
});

describe('txt', () => {
  it('strips markdown headers and bold', () => {
    const txt = runExport(makeInput(), cfg({ format: 'txt' })).content;
    expect(txt).not.toContain('# ');
    expect(txt).not.toContain('**');
    expect(txt).toContain('Meeting purpose');
  });
});

describe('filename', () => {
  it('builds loquia-<slug>-<kind>.<ext>', () => {
    expect(buildFilename('Commercial meeting with Atlas', cfg({ format: 'md' }))).toBe(
      'loquia-commercial-meeting-with-atlas-ai-pack.md',
    );
    expect(buildFilename('Reunião com Atlas', cfg({ format: 'json', preset: 'transcript' }))).toBe(
      'loquia-reuniao-com-atlas-transcript.json',
    );
  });
});
