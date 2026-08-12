import type { BrowserStorageAdapter } from '@loquia/contracts';

/**
 * localStorage-backed storage with an SSR-safe in-memory fallback, so the same
 * adapter works during server render, tests and the browser.
 */
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
  keysWithPrefix(prefix: string) {
    return [...this.map.keys()].filter((k) => k.startsWith(prefix));
  }
}

const memory = new MemoryStorage();

function backend(): Storage | MemoryStorage {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const probe = '__loquia_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch {
      return memory;
    }
  }
  return memory;
}

export function createBrowserStorage(namespace = 'loquia'): BrowserStorageAdapter {
  const prefix = `${namespace}:`;
  return {
    get<T>(key: string): T | null {
      const raw = backend().getItem(prefix + key);
      if (raw == null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    set<T>(key: string, value: T): void {
      backend().setItem(prefix + key, JSON.stringify(value));
    },
    remove(key: string): void {
      backend().removeItem(prefix + key);
    },
    clear(): void {
      const store = backend();
      if (store instanceof MemoryStorage) {
        store.keysWithPrefix(prefix).forEach((k) => store.removeItem(k));
        return;
      }
      const toRemove: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key && key.startsWith(prefix)) toRemove.push(key);
      }
      toRemove.forEach((k) => store.removeItem(k));
    },
  };
}
