import type {
  MediaRecorderAdapter,
  RecorderPermissionState,
  RecorderResult,
  RecorderTick,
} from '@loquia/contracts';

/**
 * Recorder adapter (Local First, Milestone 5 REVISADA). When a microphone +
 * MediaRecorder are available it captures REAL audio into a Blob so the recording
 * can be persisted on-device. On machines without a mic (SSR, headless tests) it
 * falls back to a deterministic synthesized signal and still returns a small REAL
 * Blob, so the local-first flow (persist → play → export) works everywhere.
 *
 * The live waveform amplitude is synthesized for the visualization; the stored
 * audio is the genuine captured stream when a mic is present.
 */
export function createMediaRecorderAdapter(): MediaRecorderAdapter {
  let permission: RecorderPermissionState = 'permission_unknown';
  let timer: ReturnType<typeof setInterval> | null = null;
  // Elapsed time is derived from the WALL CLOCK, never from counting interval
  // ticks: browsers throttle setInterval (background tabs, and mobile in general),
  // so a tick-counter runs far behind real time — a 5-minute recording would show
  // ~1 minute, and the reported duration would be wrong too. `runStartedAt` marks
  // when the current running segment began; `accumulatedMs` holds completed
  // (pre-pause) segments.
  let runStartedAt = 0;
  let accumulatedMs = 0;
  let elapsedMs = 0;
  let running = false;

  function now(): number {
    return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
  }
  /** True wall-clock elapsed time across pauses, in ms. */
  function elapsedNow(): number {
    return accumulatedMs + (running ? now() - runStartedAt : 0);
  }
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  const peaks: number[] = [];

  // Screen Wake Lock — on mobile the OS screensaver/auto-lock suspends the page
  // and kills the mic capture, so a recording silently stops when the screen
  // sleeps. Holding a 'screen' wake lock while recording keeps the display awake.
  // The lock is auto-released by the browser when the tab is hidden, so we also
  // re-acquire it on visibilitychange whenever we're still recording.
  type WakeLockSentinelLike = {
    release: () => Promise<void> | void;
    addEventListener?: (type: 'release', listener: () => void) => void;
  };
  let wakeLock: WakeLockSentinelLike | null = null;
  let onVisibility: (() => void) | null = null;

  async function acquireWakeLock(): Promise<void> {
    try {
      const wl = (navigator as unknown as {
        wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
      }).wakeLock;
      if (!wl || wakeLock) return;
      const sentinel = await wl.request('screen');
      wakeLock = sentinel;
      // The OS can drop the lock (e.g. the tab briefly backgrounds); when it does,
      // re-acquire immediately as long as we are still recording, so the screen
      // does not get a chance to sleep and suspend the capture.
      sentinel.addEventListener?.('release', () => {
        wakeLock = null;
        if (running) void acquireWakeLock();
      });
    } catch {
      // Not supported (older iOS/Safari) or blocked — non-fatal; recording still runs.
    }
  }

  function releaseWakeLock(): void {
    try {
      void wakeLock?.release();
    } catch {
      /* ignore */
    }
    wakeLock = null;
  }

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
    const a = Math.sin(t / 260) * 0.5 + 0.5;
    const b = Math.sin(t / 90 + 1.3) * 0.3 + 0.3;
    return Math.min(1, Math.max(0.08, a * 0.6 + b * 0.5));
  }

  /** A small, real WAV blob (silence) so headless/no-mic paths still persist a valid file. */
  function fallbackBlob(durationSeconds: number): { blob: Blob; mimeType: string } {
    const sampleRate = 8000;
    const samples = Math.max(sampleRate, sampleRate * Math.min(durationSeconds, 3));
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    const writeStr = (off: number, s: string) => {
      for (let i = 0; i < s.length; i += 1) view.setUint8(off + i, s.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, samples * 2, true);
    return { blob: new Blob([buffer], { type: 'audio/wav' }), mimeType: 'audio/wav' };
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
      accumulatedMs = 0;
      runStartedAt = now();
      peaks.length = 0;
      chunks = [];

      // Real capture when a live stream + MediaRecorder exist.
      if (stream && typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined') {
        try {
          recorder = new window.MediaRecorder(stream);
          recorder.ondataavailable = (e: BlobEvent) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };
          recorder.start(1000); // gather chunks every second
        } catch {
          recorder = null; // fall back to synth-only below
        }
      }

      // Keep the screen awake so the mobile screensaver can't suspend capture,
      // and re-arm everything each time the tab returns to the foreground: the OS
      // releases the wake lock (and sometimes pauses the MediaRecorder) when the
      // screen sleeps, so on return we re-acquire the lock and resume the recorder.
      void acquireWakeLock();
      if (typeof document !== 'undefined') {
        onVisibility = () => {
          if (document.visibilityState !== 'visible' || !running) return;
          void acquireWakeLock();
          try {
            if (recorder && recorder.state === 'paused') recorder.resume();
          } catch {
            /* ignore */
          }
        };
        document.addEventListener('visibilitychange', onVisibility);
      }

      const step = 100;
      timer = setInterval(() => {
        if (!running) return;
        // Elapsed comes from the wall clock, so throttled/coalesced ticks never
        // make the displayed time drift behind the real recording length.
        elapsedMs = elapsedNow();
        const amplitude = synthAmplitude(elapsedMs);
        peaks.push(Number(amplitude.toFixed(3)));
        if (peaks.length > 600) peaks.shift(); // bound memory on long recordings
        onTick({ elapsedSeconds: Math.floor(elapsedMs / 1000), amplitude });
      }, step);
    },

    pause() {
      if (running) accumulatedMs += now() - runStartedAt; // bank the running segment
      running = false;
      releaseWakeLock();
      try {
        recorder?.state === 'recording' && recorder.pause();
      } catch {
        /* ignore */
      }
    },

    resume() {
      runStartedAt = now(); // start a new running segment
      running = true;
      void acquireWakeLock();
      try {
        recorder?.state === 'paused' && recorder.resume();
      } catch {
        /* ignore */
      }
    },

    async stop(): Promise<RecorderResult> {
      elapsedMs = elapsedNow(); // final wall-clock length before we stop the clock
      running = false;
      releaseWakeLock();
      if (onVisibility && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
        onVisibility = null;
      }
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      const durationSeconds = Math.max(1, Math.floor(elapsedMs / 1000));
      const waveformPeaks = peaks.length > 0 ? [...peaks] : [0.4, 0.7, 0.5, 0.9, 0.3];

      // Finalize the real recording if we have a MediaRecorder.
      let blob: Blob | undefined;
      let mimeType: string | undefined;
      if (recorder) {
        const rec = recorder;
        const mt = rec.mimeType || 'audio/webm';
        blob = await new Promise<Blob>((resolve) => {
          rec.onstop = () => resolve(new Blob(chunks, { type: mt }));
          try {
            rec.stop();
          } catch {
            resolve(new Blob(chunks, { type: mt }));
          }
        });
        mimeType = blob.type || mt;
        recorder = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }

      // A REAL capture happened when a MediaRecorder produced non-empty audio.
      const capturedReal = !!blob && blob.size > 0;

      // No real capture (or empty) → deterministic fallback blob so the flow works
      // on machines without a mic (headless/tests). This is silence, so it must NOT
      // be reported as a real capture.
      if (!blob || blob.size === 0) {
        const fb = fallbackBlob(durationSeconds);
        blob = fb.blob;
        mimeType = fb.mimeType;
      }

      return {
        durationSeconds,
        audioRef: `local-audio://${durationSeconds}s`,
        waveformPeaks,
        blob,
        mimeType,
        capturedReal,
      };
    },
  };
}

/** Map a recording MIME type to a coherent file extension (§14/§15). */
export function extensionForMime(mimeType: string): string {
  const base = mimeType.split(';')[0]!.trim().toLowerCase();
  switch (base) {
    case 'audio/webm':
      return 'webm';
    case 'audio/ogg':
      return 'ogg';
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav';
    case 'audio/mp4':
    case 'audio/m4a':
      return 'm4a';
    case 'audio/mpeg':
      return 'mp3';
    default:
      return 'webm';
  }
}
