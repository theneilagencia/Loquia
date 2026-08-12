import type { ClipboardAdapter } from '@loquia/contracts';

export function createClipboardAdapter(): ClipboardAdapter {
  return {
    isSupported() {
      return typeof navigator !== 'undefined' && !!navigator.clipboard;
    },
    async writeText(text: string) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return;
      }
      // Fallback for environments without the async clipboard API.
      if (typeof document !== 'undefined') {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(el);
        }
        return;
      }
      throw new Error('Clipboard is not available in this environment.');
    },
  };
}
