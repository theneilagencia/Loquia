import {
  PACK_SECTION_REQUIRED,
  PACK_SECTION_TITLE,
  type AIPack,
  type AIPackSection,
  type PackSectionKey,
  type SectionConfidence,
} from '@loquia/domain';
import type { ExportInput } from './engine';

function section(
  key: PackSectionKey,
  confidence: SectionConfidence,
  lines: AIPackSection['lines'],
): AIPackSection {
  return { key, title: PACK_SECTION_TITLE[key], required: PACK_SECTION_REQUIRED[key], confidence, lines };
}

/** Resolved AI Pack (English output) mirroring the prototype's m1 (Atlas). */
export function makePack(language = 'en-US'): AIPack {
  return {
    meetingId: 'm1',
    language,
    sections: [
      section('metadata', 'explicit', [
        { text: 'Commercial meeting with Atlas · Aug 10, 2026 · 42:18 · pt-BR · Browser recording' },
      ]),
      section('participants', 'explicit', [
        { text: 'Rafael Martins — Northstar' },
        { text: 'João Silva — Atlas' },
      ]),
      section('purpose', 'inferred', [
        { text: 'Discuss pilot scope, integration requirements and commercial conditions.' },
      ]),
      section('executiveContext', 'inferred', [
        { text: 'Atlas is evaluating a pilot deployment.' },
      ]),
      section('topics', 'explicit', [
        { text: 'Pilot scope · 04:12', atSeconds: 252 },
        { text: 'Integration · 11:36', atSeconds: 696 },
      ]),
      // Evidence quotes stay in the ORIGINAL spoken language (pt-BR).
      section('importantStatements', 'explicit', [
        { text: 'João Silva: “Sem a integração, não acho que a gente consiga rodar o piloto direito.”', atSeconds: 1122 },
      ]),
      section('explicitDecisions', 'explicit', [
        { text: 'The pilot will start with one business unit.' },
      ]),
      section('openPoints', 'explicit', [
        { text: 'Final integration scope remains undefined.' },
      ]),
      section('questions', 'explicit', [{ text: 'Who will own the integration?' }]),
      section('numbersAndDates', 'explicit', [{ text: 'R$ 120.000' }, { text: 'October 2026' }]),
      section('ambiguities', 'uncertain', [
        { text: 'The final launch date was discussed but not formally confirmed.' },
      ]),
    ],
  };
}

export function makeInput(over?: Partial<ExportInput>): ExportInput {
  return {
    meeting: {
      title: 'Commercial meeting with Atlas',
      date: 'Aug 10, 2026',
      duration: '42:18',
      language: 'pt-BR',
      source: 'Browser recording',
      status: 'ready',
    },
    participants: ['Rafael Martins — Northstar', 'João Silva — Atlas'],
    pack: makePack(),
    transcript: [
      { stamp: '04:12', speaker: 'Rafael Martins', text: 'A ideia é começar o piloto com uma unidade de negócio só.', atSeconds: 252 },
      { stamp: '18:42', speaker: 'João Silva', text: 'Sem a integração, não acho que a gente consiga rodar o piloto direito.', atSeconds: 1122 },
    ],
    ...over,
  };
}
