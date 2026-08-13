'use client';
import { useEffect, useState } from 'react';
import { createBrowserStorage } from '../adapters/browser-storage';
import { createLocalMediaStore } from './index';
import type { LocalMediaStore } from './store';

/**
 * Memoized LocalMediaStore per workspace. The metadata index lives in the shared
 * browser key-value storage; the blob backend is chosen once (OPFS/IndexedDB/mem).
 * Keyed by workspace so multi-user on the same browser stays isolated (§34).
 */
const cache = new Map<string, Promise<LocalMediaStore>>();

export function getLocalMediaStore(workspaceId: string): Promise<LocalMediaStore> {
  let existing = cache.get(workspaceId);
  if (!existing) {
    existing = createLocalMediaStore(createBrowserStorage(), workspaceId);
    cache.set(workspaceId, existing);
  }
  return existing;
}

/** Test/reset hook. */
export function __resetLocalMediaStores(): void {
  cache.clear();
}

/** React hook: resolve the LocalMediaStore for a workspace (null while loading). */
export function useLocalMediaStore(workspaceId: string | undefined): LocalMediaStore | null {
  const [store, setStore] = useState<LocalMediaStore | null>(null);
  useEffect(() => {
    if (!workspaceId) {
      setStore(null);
      return;
    }
    let active = true;
    getLocalMediaStore(workspaceId).then((s) => {
      if (active) setStore(s);
    });
    return () => {
      active = false;
    };
  }, [workspaceId]);
  return store;
}
