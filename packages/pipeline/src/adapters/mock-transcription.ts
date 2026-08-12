import type { TranscriptionInput, TranscriptionProvider, TranscriptionResult, TranscriptionWord } from '../transcription';

/**
 * Deterministic mock transcription for dev/tests (no external provider). Emits
 * diarized words (two speakers) with real millisecond timestamps so the
 * segmentation and persistence paths are exercised end to end.
 */
export class MockTranscriptionAdapter implements TranscriptionProvider {
  readonly name = 'mock';

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const pt = (input.languageHint ?? 'pt-BR').toLowerCase().startsWith('pt');
    const turns: { speaker: number; text: string }[] = pt
      ? [
          { speaker: 0, text: 'Bom dia a todos. Vamos começar a reunião pelo status do projeto.' },
          { speaker: 1, text: 'Claro. A descoberta terminou e encontramos três oportunidades.' },
          { speaker: 0, text: 'Ótimo. A decisão é focar na primeira oportunidade no próximo sprint.' },
          { speaker: 1, text: 'Combinado. Eu preparo os requisitos até sexta-feira.' },
        ]
      : [
          { speaker: 0, text: 'Good morning everyone. Let us start with the project status.' },
          { speaker: 1, text: 'Sure. Discovery is done and we found three opportunities.' },
          { speaker: 0, text: 'Great. The decision is to focus on the first one next sprint.' },
          { speaker: 1, text: 'Agreed. I will prepare the requirements by Friday.' },
        ];

    const words: TranscriptionWord[] = [];
    let cursorMs = 0;
    for (const turn of turns) {
      for (const token of turn.text.split(' ')) {
        const startMs = cursorMs;
        const endMs = cursorMs + 320;
        words.push({ text: token, startMs, endMs, confidence: 0.95, providerSpeaker: turn.speaker });
        cursorMs = endMs + 40;
      }
      cursorMs += 700; // pause between turns
    }

    return {
      words,
      detectedLanguage: pt ? 'pt-BR' : 'en-US',
      provider: 'mock',
      providerRequestId: 'mock-request',
      model: 'mock-1',
      durationMs: cursorMs,
    };
  }
}
