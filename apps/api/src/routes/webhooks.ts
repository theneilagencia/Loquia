import { timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { processingJobs } from '../db/schema';
import { applyTranscriptionCallback } from '../services/ingest';

/** Constant-time secret compare (never leaks length-independent timing). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

/**
 * Transcription provider callback (Milestone 5.2 async model, §4-§8). PUBLIC — no
 * user session. It authenticates itself with a shared secret token and binds each
 * callback to a known ProcessingJob by the provider request id. Unknown/unauth
 * callbacks are rejected. Processing is idempotent: a re-delivered callback never
 * duplicates the transcript or the AI Pack job. Responds 2xx only after the
 * result has been accepted/persisted (§7).
 */
export async function registerWebhookRoutes(app: FastifyInstance): Promise<void> {
  const { db, env, transcription, enqueue } = app.ctx;
  const expectedToken = env.DEEPGRAM_CALLBACK_SECRET ?? 'dev-callback-secret';

  app.post('/api/webhooks/deepgram', async (request, reply) => {
    // 1) Authenticate the callback itself (own auth, not a user session).
    const token = (request.query as { token?: string })?.token ?? '';
    if (!safeEqual(token, expectedToken)) {
      request.log.warn({ event: 'stt_callback_unauthorized' }, 'rejected unauthorized STT callback');
      return reply.status(401).send({ error: { code: 'unauthorized', message: 'Invalid callback token', requestId: request.id } });
    }

    // 2) Bind to a known job by the provider request id in the payload.
    const payload = request.body as unknown;
    const providerRequestId = transcription.callbackRequestId(payload);
    if (!providerRequestId) {
      return reply.status(400).send({ error: { code: 'bad_request', message: 'Missing provider request id', requestId: request.id } });
    }
    const rows = await db.select().from(processingJobs).where(eq(processingJobs.providerRequestId, providerRequestId)).limit(1);
    const job = rows[0];
    if (!job || job.type !== 'transcription') {
      // Unknown callback — do not process. 404 so the provider can surface it.
      request.log.warn({ event: 'stt_callback_unknown', providerRequestId }, 'unknown STT callback');
      return reply.status(404).send({ error: { code: 'not_found', message: 'Unknown callback', requestId: request.id } });
    }

    // 3) Map + persist (idempotent). Respond 2xx only after acceptance.
    const outcome = transcription.parseCallback(payload);
    const result = await applyTranscriptionCallback(
      { db, transcription, enqueue, log: (event, fields) => request.log.info({ event, ...fields }, event) },
      job,
      outcome,
    );
    // completed / duplicate / failed(mapped) are all "we handled it" → 200.
    return reply.status(200).send({ status: result.status });
  });
}
