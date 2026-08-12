import type { Services } from '@loquia/contracts';
import { createBrowserStorage } from './adapters/browser-storage';
import { createClipboardAdapter } from './adapters/clipboard';
import { createDownloadAdapter } from './adapters/download';
import { MockStore } from './mock/db';
import { createMockServices } from './mock/services';

let singleton: Services | null = null;

/**
 * Build (or return) the app's service container. Milestone 1 wires the
 * MockAdapter; a future ApiAdapter would be swapped in here with no changes to
 * the UI, which only ever depends on the `Services` contract.
 */
export function getServices(): Services {
  if (singleton) return singleton;
  const storage = createBrowserStorage();
  const store = new MockStore(storage);
  singleton = createMockServices({
    store,
    clipboard: createClipboardAdapter(),
    download: createDownloadAdapter(),
  });
  return singleton;
}

/** Test helper: force a fresh container (e.g. between unit tests). */
export function __resetServicesForTest(): void {
  singleton = null;
}
