/** Server-side object key generation + upload validation (task §7, §9, §36). */

export const ACCEPTED_MIME: ReadonlySet<string> = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'video/mp4',
  'video/webm',
]);

const EXT_BY_MIME: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

/** Strip any path, normalize, and keep a safe filename with an extension. */
export function sanitizeFilename(filename: string, mimeType?: string): string {
  const base = (filename.split(/[\\/]/).pop() ?? '').trim();
  const dot = base.lastIndexOf('.');
  const rawName = dot > 0 ? base.slice(0, dot) : base;
  const rawExt = dot > 0 ? base.slice(dot + 1) : '';
  const clean = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  let name = clean(rawName).slice(0, 80) || 'audio';
  let ext = clean(rawExt).toLowerCase();
  if (!/^[a-z0-9]{1,5}$/.test(ext)) {
    ext = mimeType && EXT_BY_MIME[mimeType] ? EXT_BY_MIME[mimeType] : 'bin';
  }
  return `${name}.${ext}`;
}

/**
 * Build a workspace-scoped object key. Never accepts a browser-provided path.
 * Format: workspace/<wsId>/meetings/<meetingId>/<mediaAssetId>/<safeFilename>
 */
export function generateObjectKey(input: {
  workspaceId: string;
  meetingId: string;
  mediaAssetId: string;
  filename: string;
  mimeType?: string;
}): string {
  const safe = sanitizeFilename(input.filename, input.mimeType);
  return `workspace/${input.workspaceId}/meetings/${input.meetingId}/${input.mediaAssetId}/${safe}`;
}

export interface UploadValidation {
  ok: boolean;
  code?: string;
  message?: string;
}

export function validateUpload(input: {
  mimeType: string;
  sizeBytes?: number;
  maxBytes: number;
}): UploadValidation {
  if (!ACCEPTED_MIME.has(input.mimeType)) {
    return { ok: false, code: 'unsupported_media_type', message: `Unsupported type: ${input.mimeType}` };
  }
  if (input.sizeBytes != null) {
    if (input.sizeBytes <= 0) return { ok: false, code: 'empty_file', message: 'File is empty' };
    if (input.sizeBytes > input.maxBytes) {
      return { ok: false, code: 'file_too_large', message: 'File exceeds the maximum size' };
    }
  }
  return { ok: true };
}
