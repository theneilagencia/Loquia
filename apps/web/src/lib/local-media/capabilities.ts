/**
 * Storage capability detection (Milestone 5 REVISADA §11/§12/§13). Never throws:
 * every probe degrades gracefully so the app keeps working when a capability is
 * missing. We never claim absolute permanence — browser storage can be evicted by
 * the device/OS.
 */

export interface StorageCapabilities {
  opfs: boolean;
  indexedDB: boolean;
  /** Whether the browser exposes the Storage persistence API at all. */
  persistenceApi: boolean;
  /** Whether storage is already marked persistent (best-effort; may be undefined). */
  persistent?: boolean;
  /** Bytes quota/usage from navigator.storage.estimate(), when available. */
  quotaBytes?: number;
  usageBytes?: number;
}

/** Minimal surface we probe — injectable so it can be unit-tested without a browser. */
export interface CapabilityGlobals {
  navigator?: {
    storage?: {
      getDirectory?: () => Promise<unknown>;
      persist?: () => Promise<boolean>;
      persisted?: () => Promise<boolean>;
      estimate?: () => Promise<{ quota?: number; usage?: number }>;
    };
  };
  indexedDB?: unknown;
}

function globalsOf(g?: CapabilityGlobals): CapabilityGlobals {
  if (g) return g;
  return {
    navigator: typeof navigator !== 'undefined' ? (navigator as unknown as CapabilityGlobals['navigator']) : undefined,
    indexedDB: typeof indexedDB !== 'undefined' ? indexedDB : undefined,
  };
}

export async function detectCapabilities(injected?: CapabilityGlobals): Promise<StorageCapabilities> {
  const g = globalsOf(injected);
  const storage = g.navigator?.storage;
  const caps: StorageCapabilities = {
    opfs: typeof storage?.getDirectory === 'function',
    indexedDB: g.indexedDB != null,
    persistenceApi: typeof storage?.persist === 'function' || typeof storage?.persisted === 'function',
  };

  if (typeof storage?.persisted === 'function') {
    try {
      caps.persistent = await storage.persisted();
    } catch {
      /* ignore */
    }
  }
  if (typeof storage?.estimate === 'function') {
    try {
      const est = await storage.estimate();
      caps.quotaBytes = est.quota;
      caps.usageBytes = est.usage;
    } catch {
      /* ignore */
    }
  }
  return caps;
}

/**
 * Ask the browser to keep our storage persistent. Best-effort: returns whether it
 * is persistent afterward. We never present this as an absolute guarantee (§12).
 */
export async function requestPersistence(injected?: CapabilityGlobals): Promise<boolean> {
  const storage = globalsOf(injected).navigator?.storage;
  if (typeof storage?.persist !== 'function') return false;
  try {
    return await storage.persist();
  } catch {
    return false;
  }
}

/** Remaining bytes available, when the estimate API is present (else undefined). */
export function availableBytes(caps: StorageCapabilities): number | undefined {
  if (caps.quotaBytes == null) return undefined;
  return Math.max(0, caps.quotaBytes - (caps.usageBytes ?? 0));
}
