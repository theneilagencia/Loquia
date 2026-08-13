/**
 * Local First media (Milestone 5 REVISADA). Public surface for the on-device
 * recording store. UI code imports from here — never the raw OPFS/IndexedDB APIs.
 */
import type { BrowserStorageAdapter } from '@loquia/contracts';
import { detectCapabilities, type CapabilityGlobals } from './capabilities';
import { selectBlobBackend } from './backends';
import { LocalMediaStore } from './store';

export * from './types';
export * from './capabilities';
export { MemoryBlobBackend, IndexedDbBlobBackend, OpfsBlobBackend, selectBlobBackend } from './backends';
export { LocalMediaStore } from './store';

/**
 * Build a LocalMediaStore for the given workspace, choosing the best available
 * backend (OPFS → IndexedDB → memory). `injected` is only for tests.
 */
export async function createLocalMediaStore(
  meta: BrowserStorageAdapter,
  namespace: string,
  injected?: CapabilityGlobals,
): Promise<LocalMediaStore> {
  const caps = await detectCapabilities(injected);
  const backend = selectBlobBackend(caps);
  return new LocalMediaStore(backend, meta, namespace);
}
