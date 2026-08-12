let counter = 0;

/** Monotonic, sortable-ish id generator for the mock backend. */
export function newId(prefix = 'id'): string {
  counter += 1;
  const time = Date.now().toString(36);
  const seq = counter.toString(36).padStart(4, '0');
  return `${prefix}_${time}${seq}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
