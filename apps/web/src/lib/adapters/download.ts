import type { DownloadAdapter } from '@loquia/contracts';

export function createDownloadAdapter(): DownloadAdapter {
  return {
    download(filename: string, content: string, mimeType: string) {
      if (typeof document === 'undefined' || typeof URL === 'undefined') {
        throw new Error('Download is not available in this environment.');
      }
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      // Revoke on the next tick so the download has time to start.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    },
  };
}
