import IORedis, { type Redis } from 'ioredis';

/** The single processing queue. Payload is minimal — the worker loads from DB. */
export const MEETING_QUEUE = 'meeting-processing';

export interface MeetingJobData {
  processingJobId: string;
}

/** ioredis connection configured for BullMQ (maxRetriesPerRequest must be null). */
export function createRedis(url: string): Redis {
  return new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
}
