/**
 * @loquia/api — SCAFFOLDING ONLY (Milestone 1).
 *
 * The real backend (Fastify, Postgres/Drizzle, queue, STT/LLM) is Milestone 2
 * and is intentionally NOT implemented here. This module only re-exports the
 * shared service contracts so the future API implements the same interfaces the
 * MockAdapter satisfies today — guaranteeing a drop-in ApiAdapter later.
 */
export type { Services } from '@loquia/contracts';

export const API_STATUS = 'not-implemented-milestone-1' as const;
