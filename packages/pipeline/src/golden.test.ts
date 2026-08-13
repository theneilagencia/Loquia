import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolvePack, type PackSource } from '@loquia/domain';
import { MockAIPackGenerator } from './adapters/mock-ai-pack';
import { buildPackSource } from './ai-pack-evidence';
import { evaluateAIPackIntegrity, type IntegritySegment } from './ai-pack-integrity';
import type { AIPackGenerationInput, GenSegment } from './ai-pack';

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../tests/fixtures/golden-meeting.json', import.meta.url)), 'utf8'),
) as {
  meeting: { id: string; workspaceId: string; title: string; language: string; source: string; durationSeconds: number };
  participants: { name: string; organization?: string; isExternal?: boolean }[];
  segments: { id: string; speakerKey: string; speakerLabel: string; startSeconds: number; endSeconds: number; text: string }[];
};
const expected = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../tests/fixtures/golden-meeting.expected.json', import.meta.url)), 'utf8'),
) as Record<string, unknown>;

const genSegments: GenSegment[] = fixture.segments.map((s) => ({
  id: s.id,
  speakerId: s.speakerKey,
  speakerLabel: s.speakerLabel,
  startSeconds: s.startSeconds,
  endSeconds: s.endSeconds,
  text: s.text,
}));
const integritySegments: IntegritySegment[] = fixture.segments.map((s) => ({ id: s.id, startSeconds: s.startSeconds, text: s.text }));

function input(outputLanguage: string): AIPackGenerationInput {
  return {
    meeting: { ...fixture.meeting },
    participants: fixture.participants,
    transcript: genSegments,
    outputLanguage,
  };
}

/** Render every line's resolved text for coarse content checks. */
function allText(source: PackSource, outputLanguage: string): string {
  return resolvePack(source, outputLanguage).sections.flatMap((s) => s.lines.map((l) => l.text)).join('\n');
}

describe('golden AI Pack — factual integrity (deterministic)', () => {
  const gen = new MockAIPackGenerator();

  it('every evidence reference resolves and timestamps/excerpts derive from segments', async () => {
    const result = await gen.generate(input('pt-BR'));
    const { source, stats } = buildPackSource(input('pt-BR'), result.sections, genSegments);
    const report = evaluateAIPackIntegrity(source, integritySegments);

    expect(report.evidenceReferenceValidity).toBe(1); // allEvidenceReferencesValid
    expect(report.invalidEvidenceRefs).toBe(0);
    expect(report.timestampsDerived).toBe(true);
    expect(report.excerptsDerived).toBe(true);
    expect(report.unsupportedCriticalClaims).toBe(0);
    expect(stats.droppedFacts).toBe(0);
  });

  it('detects decision, keeps a suggestion out of decisions, and keeps the open question', async () => {
    const result = await gen.generate(input('pt-BR'));
    const decisions = result.sections.find((s) => s.key === 'explicitDecisions');
    const questions = result.sections.find((s) => s.key === 'questions');
    // A decision was stated (seg_a2) — exactly one in the fixture.
    expect(decisions?.facts.length ?? 0).toBeGreaterThanOrEqual(1);
    // The suggestion (seg_a3) must NOT be cited as a decision.
    const decisionIds = (decisions?.facts ?? []).flatMap((f) => f.segmentIds);
    expect(decisionIds).not.toContain('seg_a3');
    // The open question (seg_a6) is detected.
    expect((questions?.facts ?? []).flatMap((f) => f.segmentIds)).toContain('seg_a6');
  });

  it('preserves numbers and dates exactly in the pack', async () => {
    const result = await gen.generate(input('pt-BR'));
    const { source } = buildPackSource(input('pt-BR'), result.sections, genSegments);
    const text = allText(source, 'pt-BR');
    for (const n of expected.numbersPreserved as string[]) expect(text).toContain(n);
    // Dates live in the original-language evidence/statement lines.
    expect(text).toMatch(/12 de março|20 de março/);
  });

  it('cross-language: en-US output keeps pt-BR evidence, numbers and dates', async () => {
    const result = await gen.generate(input('en-US'));
    const { source } = buildPackSource(input('en-US'), result.sections, genSegments);
    const report = evaluateAIPackIntegrity(source, integritySegments);
    expect(report.evidenceReferenceValidity).toBe(1);
    // Evidence excerpts stay in the original spoken language (Portuguese words).
    const text = allText(source, 'en-US');
    expect(text).toMatch(/orçamento|fornecedor|piloto|março/); // original pt-BR
    expect(text).toContain('120'); // numbers preserved
  });

  it('integrity gate FLAGS a hallucinated segment id (guards the check itself)', () => {
    const tampered: PackSource = {
      meetingId: fixture.meeting.id,
      sections: [
        { key: 'importantStatements', confidence: 'explicit', lines: [{ text: 'ghost', atSeconds: 999, segmentIds: ['seg_does_not_exist'] }] },
      ],
    };
    const report = evaluateAIPackIntegrity(tampered, integritySegments);
    expect(report.evidenceReferenceValidity).toBeLessThan(1);
    expect(report.unsupportedCriticalClaims).toBe(1);
    expect(report.invalidRefs[0]?.segmentId).toBe('seg_does_not_exist');
  });
});
