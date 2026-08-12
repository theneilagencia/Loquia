/** Standard API error model (task §23): code, message, requestId, details. */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errors = {
  unauthorized: (msg = 'Not authenticated') => new ApiError(401, 'unauthorized', msg),
  forbidden: (msg = 'Not authorized') => new ApiError(403, 'forbidden', msg),
  notFound: (msg = 'Not found') => new ApiError(404, 'not_found', msg),
  conflict: (msg = 'Conflict') => new ApiError(409, 'conflict', msg),
  badRequest: (msg = 'Invalid request', details?: unknown) =>
    new ApiError(400, 'bad_request', msg, details),
  validation: (details: unknown) => new ApiError(422, 'validation_error', 'Validation failed', details),
  invalidState: (msg = 'Invalid state') => new ApiError(409, 'invalid_state', msg),
  rateLimited: (msg = 'Too many requests') => new ApiError(429, 'rate_limited', msg),
};

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}
