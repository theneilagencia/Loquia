/**
 * Browser capability abstractions (task spec §12). Components must not touch
 * localStorage / clipboard / Blob / MediaRecorder directly — they go through
 * these ports so behaviour is testable and swappable.
 */

export interface BrowserStorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

export interface ClipboardAdapter {
  writeText(text: string): Promise<void>;
  isSupported(): boolean;
}

export interface DownloadAdapter {
  download(filename: string, content: string, mimeType: string): void;
}

export type RecorderPermissionState =
  | 'permission_unknown'
  | 'permission_requested'
  | 'permission_granted'
  | 'permission_denied'
  | 'device_missing'
  | 'device_disconnected'
  | 'unsupported'
  | 'error';

export type RecorderRunState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface RecorderTick {
  elapsedSeconds: number;
  /** Instantaneous amplitude in [0,1] for the live waveform. */
  amplitude: number;
}

export interface RecorderResult {
  durationSeconds: number;
  audioRef: string;
  waveformPeaks: number[];
}

export interface MediaRecorderAdapter {
  getPermissionState(): RecorderPermissionState;
  requestPermission(): Promise<RecorderPermissionState>;
  start(onTick: (tick: RecorderTick) => void): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): Promise<RecorderResult>;
  isSupported(): boolean;
}
