/**
 * Accepted audio formats for direct processing (Milestone 5.2). Kept minimal
 * after the R2 removal: object keys / presigned uploads are gone, so only the
 * MIME allowlist survives (used to register the ingest content-type parsers and
 * to reject non-audio uploads §49).
 */
export const ACCEPTED_MIME: ReadonlySet<string> = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/mpeg',
  'audio/mp3',
  'video/webm',
]);

export function isAcceptedAudioMime(mimeType: string): boolean {
  return ACCEPTED_MIME.has(mimeType.split(';')[0]!.trim().toLowerCase());
}
