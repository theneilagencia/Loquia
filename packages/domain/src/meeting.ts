import type { Id, ISODateString, LanguageTag } from './common';
import type { AIPackStatus } from './ai-pack';

/** Source of a meeting's audio. */
export type MeetingSource = 'recording' | 'upload';

export type MeetingStatus =
  | 'draft'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'archived';

export interface Speaker {
  id: Id;
  /** Stable label emitted by (mock) diarization, e.g. "Speaker 1". */
  diarizationLabel: string;
  /** Human name after rename; falls back to `diarizationLabel` in the UI. */
  displayName?: string;
  color: string;
}

export interface Marker {
  id: Id;
  /** Seconds from start of recording. */
  atSeconds: number;
  label: string;
  createdAt: ISODateString;
  kind: 'user' | 'auto';
}

export interface TranscriptSegment {
  id: Id;
  speakerId: Id;
  startSeconds: number;
  endSeconds: number;
  text: string;
  /** True once a user has edited the original transcribed text. */
  edited: boolean;
  /** Language of THIS segment's text — evidence keeps its original language. */
  language: LanguageTag;
}

export interface Transcript {
  meetingId: Id;
  language: LanguageTag;
  segments: TranscriptSegment[];
  speakers: Speaker[];
  updatedAt: ISODateString;
}

export interface Recording {
  id: Id;
  meetingId: Id;
  durationSeconds: number;
  /** Mock object URL / demo asset reference — never a real upload. */
  audioRef: string;
  /** Normalised waveform peaks in [0,1], sampled for rendering. */
  waveformPeaks: number[];
  createdAt: ISODateString;
  source: MeetingSource;
}

export interface Meeting {
  id: Id;
  workspaceId: Id;
  ownerId: Id;
  title: string;
  source: MeetingSource;
  status: MeetingStatus;
  /** Language actually spoken in the meeting. */
  meetingLanguage: LanguageTag;
  durationSeconds: number;
  participantCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  archivedAt?: ISODateString;
  recordingId?: Id;
  /** AI Pack generation state, independent of the transcript `status`. */
  aiPackStatus?: AIPackStatus;
  /** Convenience denormalisation for list rendering. */
  summaryLine?: string;
}
