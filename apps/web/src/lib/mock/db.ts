import type { BrowserStorageAdapter } from '@loquia/contracts';
import { buildSeed, DB_VERSION, type MockDB } from './seed';

const DB_KEY = 'mockdb';

/**
 * Mock persistence store. Loads from the injected storage (localStorage in the
 * browser, memory on the server), seeding on first use and migrating on version
 * bumps. Every mutation is persisted, so a page refresh never resets state
 * (task spec §13).
 */
export class MockStore {
  private cache: MockDB | null = null;

  constructor(private readonly storage: BrowserStorageAdapter) {}

  read(): MockDB {
    if (this.cache) return this.cache;
    const stored = this.storage.get<MockDB>(DB_KEY);
    if (stored && stored.version === DB_VERSION) {
      this.cache = stored;
      return stored;
    }
    const seed = buildSeed();
    this.cache = seed;
    this.storage.set(DB_KEY, seed);
    return seed;
  }

  /** Apply a mutation and persist atomically. */
  write<T>(mutator: (db: MockDB) => T): T {
    const db = this.read();
    const result = mutator(db);
    this.storage.set(DB_KEY, db);
    this.cache = db;
    return result;
  }

  reset(): void {
    const seed = buildSeed();
    this.cache = seed;
    this.storage.set(DB_KEY, seed);
  }

  snapshot(): MockDB {
    return this.read();
  }
}
