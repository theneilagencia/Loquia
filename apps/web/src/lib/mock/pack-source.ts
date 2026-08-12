/**
 * The persisted AI Pack source shape and its language resolver now live in
 * `@loquia/domain` so the web app, the API and the worker share one definition.
 * This module re-exports them for the existing web import paths.
 */
export {
  resolvePack,
  type PackSource,
  type SourceSection,
  type SourceLine,
} from '@loquia/domain';
