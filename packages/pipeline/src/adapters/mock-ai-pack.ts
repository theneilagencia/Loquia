import type {
  AIPackGenerationInput,
  AIPackGenerationResult,
  AIPackGenerator,
  FactClassification,
  GeneratedFact,
  GeneratedSection,
  GenSegment,
} from '../ai-pack';
import { PROMPT_VERSION } from './../ai-pack-prompt';
import { SCHEMA_VERSION } from './../ai-pack-schema';

/**
 * Deterministic AI Pack generator for dev/tests (no LLM). It derives sections
 * from the REAL input segments — every cited segment id is valid, so the
 * evidence-resolution path is exercised end to end without an external call.
 * Same input always yields the same pack.
 */
export class MockAIPackGenerator implements AIPackGenerator {
  readonly name = 'mock';
  readonly model = 'mock-aipack-1';

  async generate(input: AIPackGenerationInput): Promise<AIPackGenerationResult> {
    const pt = input.outputLanguage.toLowerCase().startsWith('pt');
    const t = (ptText: string, enText: string) => (pt ? ptText : enText);
    const segs = input.transcript;

    const fact = (text: string, classification: FactClassification, ...ids: string[]): GeneratedFact => ({
      text,
      classification,
      segmentIds: ids,
    });

    const sections: GeneratedSection[] = [];
    if (segs.length === 0) {
      return this.result(input, sections);
    }

    const first = segs[0]!;
    const last = segs[segs.length - 1]!;
    const longest = [...segs].sort((a, b) => b.text.length - a.text.length).slice(0, 2);
    const withDigits = segs.filter((s) => /\d/.test(s.text)).slice(0, 3);
    const questions = segs.filter((s) => s.text.trim().endsWith('?')).slice(0, 3);
    const decisionSeg = segs.find((s) => /decis|decid|combinad|agreed|decide/i.test(s.text));

    sections.push({
      key: 'purpose',
      facts: [fact(t('Reunião para revisar o status e próximos passos do projeto.', 'Meeting to review project status and next steps.'), 'inferred', first.id)],
    });
    sections.push({
      key: 'topics',
      facts: longest.map((s) => fact(t('Assunto discutido na reunião.', 'Topic discussed in the meeting.'), 'explicit', s.id)),
    });
    sections.push({
      key: 'importantStatements',
      facts: longest.map((s: GenSegment) => fact('statement', 'explicit', s.id)),
    });
    sections.push({
      key: 'explicitDecisions',
      facts: decisionSeg
        ? [fact(t('Decisão registrada na conversa.', 'Decision stated in the conversation.'), 'explicit', decisionSeg.id)]
        : [],
    });
    sections.push({
      key: 'openPoints',
      facts: [fact(t('Item pendente para acompanhamento.', 'Open item to follow up.'), 'inferred', last.id)],
    });
    if (questions.length) {
      sections.push({ key: 'questions', facts: questions.map((s) => fact(t('Pergunta levantada.', 'Question raised.'), 'explicit', s.id)) });
    }
    if (withDigits.length) {
      sections.push({ key: 'numbersAndDates', facts: withDigits.map((s) => fact(s.text.replace(/[^\d.,:/-]+/g, ' ').trim() || 'value', 'explicit', s.id)) });
    }

    return this.result(input, sections);
  }

  private result(input: AIPackGenerationInput, sections: GeneratedSection[]): AIPackGenerationResult {
    return {
      sections,
      outputLanguage: input.outputLanguage,
      provider: this.name,
      model: this.model,
      promptVersion: PROMPT_VERSION,
      schemaVersion: SCHEMA_VERSION,
      usage: { requestCount: 1 },
    };
  }
}
