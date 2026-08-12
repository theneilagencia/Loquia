/** Error categories that drive retry classification in the worker (task §17). */
export type PipelineErrorCategory =
  | 'network'
  | 'provider_timeout'
  | 'provider_5xx'
  | 'storage_access'
  | 'unsupported_media'
  | 'invalid_audio'
  | 'authorization'
  | 'provider_rejected'
  | 'unknown';

const RETRYABLE: ReadonlySet<PipelineErrorCategory> = new Set([
  'network',
  'provider_timeout',
  'provider_5xx',
  'storage_access',
]);

export class PipelineError extends Error {
  constructor(
    public readonly category: PipelineErrorCategory,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'PipelineError';
  }

  get retryable(): boolean {
    return RETRYABLE.has(this.category);
  }
}

export function isRetryable(err: unknown): boolean {
  return err instanceof PipelineError && err.retryable;
}
