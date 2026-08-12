/**
 * Common primitives shared across the Loquia domain.
 *
 * NOTE (Milestone 1): the canonical `docs/domain-types.md` handoff was absent
 * from the repository, so this domain model was reconstructed from the task
 * specification. It is intentionally conservative and framework-agnostic.
 */

/** ISO-8601 timestamp string, e.g. "2026-08-12T13:00:00.000Z". */
export type ISODateString = string;

/** Opaque identifier. Mock adapters generate ULID-like strings. */
export type Id = string;

/** UI locales that are fully translated in Milestone 1. */
export type ActiveLocale = 'pt-BR' | 'en-US';

/** Locales the architecture is prepared for but not yet translated. */
export type PlannedLocale = 'es-ES' | 'es-MX' | 'fr-FR' | 'de-DE';

/** Any locale the app can route to. */
export type Locale = ActiveLocale | PlannedLocale;

export const ACTIVE_LOCALES: readonly ActiveLocale[] = ['pt-BR', 'en-US'];
export const PLANNED_LOCALES: readonly PlannedLocale[] = [
  'es-ES',
  'es-MX',
  'fr-FR',
  'de-DE',
];
export const ALL_LOCALES: readonly Locale[] = [...ACTIVE_LOCALES, ...PLANNED_LOCALES];

export const DEFAULT_LOCALE: ActiveLocale = 'pt-BR';

/**
 * BCP-47 language tag used for meeting audio, transcript and export languages.
 * Kept distinct from `Locale` (UI) on purpose — the four language axes are
 * independent (see docs: UI vs meeting vs transcript vs export language).
 */
export type LanguageTag = string;

export type Theme = 'system' | 'light' | 'dark';

/** Discriminated result helper used by services instead of throwing. */
export type Result<T, E = ServiceError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface ServiceError {
  code: string;
  message: string;
  /** Optional field-level details for form validation surfaces. */
  fields?: Record<string, string>;
}

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

export function err<E = ServiceError>(error: E): { ok: false; error: E } {
  return { ok: false, error };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
