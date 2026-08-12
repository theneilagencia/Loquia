import type {
  MediaRecorderAdapter,
  RecorderPermissionState,
  RecorderResult,
  RecorderTick,
} from '@loquia/contracts';

/**
 * Recorder adapter. In Milestone 1 there is no real STT: the adapter attempts a
 * genuine getUserMedia permission flow when a microphone is available (so the
 * UI's permission states are real), but the captured signal is synthesized so
 * the recorder works deterministically in tests, SSR and machines without a mic.
 */
export function createMediaRecorderAdapter(): MediaRecorderAdapter {
  let permission: RecorderPermissionState = 'permission_unknown';
  let timer: ReturnType<typeof setInterval> | null = null;
  let elapsedMs = 0;
  let running = false;
  let stream: MediaStream | null = null;
  const peaks: number[] = [];

  function supported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window.MediaRecorder !== 'undefined'
    );
  }

  function synthAmplitude(t: number): number {
    // Smooth, deterministic pseudo-waveform in [0.1, 1].
    const a = Math.sin(t / 260) * 0.5 + 0.5;
    const b = Math.sin(t / 90 + 1.3) * 0.3 + 0.3;
    return Math.min(1, Math.max(0.08, a * 0.6 + b * 0.5));
  }

  return {
    isSupported: supported,

    getPermissionState() {
      if (!supported()) return 'unsupported';
      return permission;
    },

    async requestPermission() {
      if (!supported()) {
        permission = 'unsupported';
        return permission;
      }
      permission = 'permission_requested';
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        permission = 'permission_granted';
      } catch (error) {
        const name = (error as { name?: string })?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          permission = 'permission_denied';
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          permission = 'device_missing';
        } else {
          permission = 'error';
        }
      }
      return permission;
    },

    async start(onTick: (tick: RecorderTick) => void) {
      running = true;
      elapsedMs = 0;
      peaks.length = 0;
      const step = 100; // ms
      timer = setInterval(() => {
        if (!running) return;
        elapsedMs += step;
        const amplitude = synthAmplitude(elapsedMs);
        // Downsample peaks for the stored waveform (~1 every 500ms).
        if (elapsedMs % 500 === 0) peaks.push(Number(amplitude.toFixed(3)));
        onTick({ elapsedSeconds: Math.floor(elapsedMs / 1000), amplitude });
      }, step);
    },

    pause() {
      running = false;
    },

    resume() {
      running = true;
    },

    async stop(): Promise<RecorderResult> {
      running = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      const durationSeconds = Math.max(1, Math.floor(elapsedMs / 1000));
      const waveformPeaks = peaks.length > 0 ? [...peaks] : [0.4, 0.7, 0.5, 0.9, 0.3];
      return {
        durationSeconds,
        audioRef: `mock-audio://${durationSeconds}s`,
        waveformPeaks,
      };
    },
  };
}
