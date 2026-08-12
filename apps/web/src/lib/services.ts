import type { Services } from '@loquia/contracts';
import { createBrowserStorage } from './adapters/browser-storage';
import { createClipboardAdapter } from './adapters/clipboard';
import { createDownloadAdapter } from './adapters/download';
import { MockStore } from './mock/db';
import { createMockServices } from './mock/services';
import { createApiServices } from './api/api-services';

let singleton: Services | null = null;

/** 'api' uses the real backend (ApiAdapter); anything else uses the MockAdapter. */
export function appMode(): 'api' | 'mock' {
  const mode = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_MODE : undefined;
  return mode === 'api' ? 'api' : 'mock';
}

/**
 * Build (or return) the app's service container. The UI depends only on the
 * `Services` contract — swapping MockAdapter for ApiAdapter here changes nothing
 * in the components (task §24).
 */
export function getServices(): Services {
  if (singleton) return singleton;
  const clipboard = createClipboardAdapter();
  const download = createDownloadAdapter();
  const storage = createBrowserStorage();

  if (appMode() === 'api') {
    singleton = createApiServices({ clipboard, download, storage });
  } else {
    const store = new MockStore(storage);
    singleton = createMockServices({ store, clipboard, download });
  }
  return singleton;
}

/** Test helper: force a fresh container (e.g. between unit tests). */
export function __resetServicesForTest(): void {
  singleton = null;
}
