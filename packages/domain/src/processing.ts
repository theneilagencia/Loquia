import type { Id, ISODateString } from './common';

/**
 * ProcessingJob — required by task spec §10 and §26.
 *
 * A ProcessingJob models the async pipeline that turns raw audio into a
 * ready meeting. In Milestone 1 it is driven entirely by the MockAdapter,
 * but the shape matches what a real queue/worker would expose so the
 * ApiAdapter can drop in unchanged.
 */

export type ProcessingJobType =
  | 'media_processing'
  | 'transcription'
  | 'diarization'
  | 'ai_pack'
  | 'translation'
  | 'export'
  /** Local First: delete the temporary remote processing copy after transcript persists. */
  | 'delete_processing_media';

export type ProcessingJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Human-facing pipeline stages (task spec §26). `stage` tracks which of these
 * the job is currently in; the UI renders them as a ProcessingTimeline.
 */
export type ProcessingStage =
  | 'received'
  | 'preparing_audio'
  | 'transcribing'
  | 'identifying_speakers'
  | 'organizing_topics'
  | 'ready_for_ai_pack';

/**
 * Canonical pipeline stages (task §18). The pipeline stops at
 * `ready_for_ai_pack`: the transcript is ready but the AI Pack is NOT generated
 * (no LLM in this milestone) — the state is represented honestly.
 */
export const PROCESSING_STAGES: readonly ProcessingStage[] = [
  'received',
  'preparing_audio',
  'transcribing',
  'identifying_speakers',
  'organizing_topics',
  'ready_for_ai_pack',
];

export interface ProcessingJob {
  id: Id;
  workspaceId: Id;
  meetingId: Id;
  type: ProcessingJobType;
  status: ProcessingJobStatus;
  stage: ProcessingStage;
  /** 0–100. */
  progress: number;
  attempt: number;
  maxAttempts: number;
  errorCode?: string;
  errorMessage?: string;
  createdAt: ISODateString;
  startedAt?: ISODateString;
  completedAt?: ISODateString;
  updatedAt: ISODateString;
}

export function stageProgress(stage: ProcessingStage): number {
  const index = PROCESSING_STAGES.indexOf(stage);
  if (index < 0) return 0;
  return Math.round((index / (PROCESSING_STAGES.length - 1)) * 100);
}

export function nextStage(stage: ProcessingStage): ProcessingStage | null {
  const index = PROCESSING_STAGES.indexOf(stage);
  if (index < 0 || index >= PROCESSING_STAGES.length - 1) return null;
  return PROCESSING_STAGES[index + 1] ?? null;
}
