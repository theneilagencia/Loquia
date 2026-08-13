import { describe, expect, it } from 'vitest';
import { downloadFilename } from './playback';
import { extensionForMime } from '../adapters/media-recorder';

describe('downloadFilename', () => {
  it('builds loquia-<slug>-<date>.<ext> with an accent-folded slug', () => {
    const name = downloadFilename('Reunião de Café!', 'webm', new Date('2026-03-12T10:00:00Z'));
    expect(name).toBe('loquia-reuniao-de-cafe-2026-03-12.webm');
  });
  it('falls back to a generic slug when the title is empty', () => {
    expect(downloadFilename('', 'wav', new Date('2026-01-02T00:00:00Z'))).toBe('loquia-gravacao-2026-01-02.wav');
  });
});

describe('extensionForMime', () => {
  it('maps common audio MIME types to coherent extensions (§14/§15)', () => {
    expect(extensionForMime('audio/webm;codecs=opus')).toBe('webm');
    expect(extensionForMime('audio/wav')).toBe('wav');
    expect(extensionForMime('audio/mp4')).toBe('m4a');
    expect(extensionForMime('audio/mpeg')).toBe('mp3');
    expect(extensionForMime('audio/ogg')).toBe('ogg');
    expect(extensionForMime('application/octet-stream')).toBe('webm');
  });
});
