import { describe, expect, it } from 'vitest';
import { createBrowserStorage } from './browser-storage';

describe('BrowserStorageAdapter', () => {
  it('round-trips typed values and namespaces keys', () => {
    const s = createBrowserStorage('test-bs');
    s.set('user', { id: 'u1', name: 'Ana' });
    expect(s.get<{ id: string; name: string }>('user')).toEqual({ id: 'u1', name: 'Ana' });
  });

  it('returns null for missing or corrupt values', () => {
    const s = createBrowserStorage('test-bs2');
    expect(s.get('missing')).toBeNull();
  });

  it('removes and clears only its namespace', () => {
    const a = createBrowserStorage('ns-a');
    const b = createBrowserStorage('ns-b');
    a.set('k', 1);
    b.set('k', 2);
    a.clear();
    expect(a.get('k')).toBeNull();
    expect(b.get('k')).toBe(2);
  });
});
