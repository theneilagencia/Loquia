import { describe, expect, it } from 'vitest';
import { parseSpeakerTranscript } from '../services/ingest';

// Pure unit tests (no DB) for the speaker-labeled transcript parser used by the
// text-ingest path. Guards the regression where an uploaded Plaud/Otter export
// collapsed every utterance onto a single speaker, so the AI Pack lost all
// "who said what" attribution.

describe('parseSpeakerTranscript', () => {
  it('parses a Plaud-style block transcript (timestamp / Speaker N / text)', () => {
    const raw = [
      '00:00:00',
      'Speaker 1',
      'Bom dia a todos, vamos começar.',
      '',
      '00:00:16',
      'Speaker 2',
      'O primeiro passo é falar com o cliente.',
      '',
      '00:03:25',
      'Speaker 1',
      'Agora eu estou abrindo a reunião como acionista e conselho.',
    ].join('\n');

    const parsed = parseSpeakerTranscript(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.speakerCount).toBe(2);
    expect(parsed!.aliases).toMatchObject({ speaker_0: 'Speaker 1', speaker_1: 'Speaker 2' });
    expect(parsed!.segments).toHaveLength(3);
    // Speakers and timestamps are preserved per utterance.
    expect(parsed!.segments[0]).toMatchObject({ speakerKey: 'speaker_0', startSeconds: 0 });
    expect(parsed!.segments[1]).toMatchObject({ speakerKey: 'speaker_1', startSeconds: 16 });
    expect(parsed!.segments[2]).toMatchObject({ speakerKey: 'speaker_0', startSeconds: 205 });
    expect(parsed!.segments[2]!.text).toContain('abrindo a reunião');
  });

  it('parses inline "Name:" / "Speaker N:" prefixes', () => {
    const raw = ['Paulo: Vamos decidir o orçamento hoje.', 'Vinícius: Concordo, proponho R$ 120 mil.'].join('\n\n');
    const parsed = parseSpeakerTranscript(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.speakerCount).toBe(2);
    expect(parsed!.aliases).toMatchObject({ speaker_0: 'Paulo', speaker_1: 'Vinícius' });
    expect(parsed!.segments[0]!.text).toBe('Vamos decidir o orçamento hoje.');
  });

  it('does NOT treat a sentence containing a colon as a speaker', () => {
    // Regression: an ordinary sentence like "Ficou decidido entao: ..." must not
    // become a phantom speaker (previously inflated participantCount).
    const raw = [
      '00:00:00',
      'Speaker 1',
      'Ficou decidido entao: lancar o produto na sexta-feira.',
      '',
      '00:00:20',
      'Speaker 2',
      'Perfeito, combinado. O prazo esta claro para todos.',
    ].join('\n');
    const parsed = parseSpeakerTranscript(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.speakerCount).toBe(2); // NOT 3
    expect(parsed!.segments[0]!.text).toContain('Ficou decidido entao:');
  });

  it('returns null for plain prose (falls back to paragraph splitting)', () => {
    expect(parseSpeakerTranscript('Este é um texto simples sem falantes.\n\nApenas parágrafos.')).toBeNull();
  });

  it('returns null when only one speaker is present', () => {
    const raw = ['00:00:00', 'Speaker 1', 'Só uma pessoa falando aqui.'].join('\n');
    expect(parseSpeakerTranscript(raw)).toBeNull();
  });
});
