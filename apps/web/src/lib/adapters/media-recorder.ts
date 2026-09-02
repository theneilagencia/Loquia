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
  let elapsedMs = 0;
  let running = false;
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  const peaks: number[] = [];

  // Real input-level metering (Web Audio). Lets us show the ACTUAL mic level and,
  // crucially, tell whether the mic delivered any audible audio at all — a silent
  // capture transcribes to nothing. Degrades to the synthesized signal if Web
  // Audio is unavailable or fails (headless/tests/older browsers).
  type AudioCtxCtor = new () => AudioContext;
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let levelBuf: Uint8Array | null = null;
  let realMeter = false;
  let realPeak = 0;

  function setupMeter(src: MediaStream): void {
    try {
      const Ctor = (window as unknown as { AudioContext?: AudioCtxCtor; webkitAudioContext?: AudioCtxCtor });
      const AC = Ctor.AudioContext ?? Ctor.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
      const node = audioCtx.createMediaStreamSource(src);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      levelBuf = new Uint8Array(analyser.fftSize);
      node.connect(analyser);
      realMeter = true;
    } catch {
      audioCtx = null;
      analyser = null;
      realMeter = false;
    }
  }

  /** Current real RMS level in [0,1], or null when metering is unavailable. */
  function realLevel(): number | null {
    if (!analyser || !levelBuf) return null;
    try {
      analyser.getByteTimeDomainData(levelBuf);
      let sum = 0;
      for (let i = 0; i < levelBuf.length; i += 1) {
        const v = (levelBuf[i]! - 128) / 128; // center at 0, range [-1,1]
        sum += v * v;
      }
      return Math.min(1, Math.sqrt(sum / levelBuf.length));
    } catch {
      return null;
    }
  }

  function teardownMeter(): void {
    try {
      void audioCtx?.close();
    } catch {
      /* ignore */
    }
    audioCtx = null;
    analyser = null;
    levelBuf = null;
    realMeter = false;
  }

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
      peaks.length = 0;
      chunks = [];
      realPeak = 0;

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
        setupMeter(stream); // measure the ACTUAL input level alongside capture
      }

      // Keep the screen awake so the mobile screensaver can't suspend capture,
      // and re-arm everything each time the tab returns to the foreground: the OS
      // releases the wake lock and suspends the AudioContext (and sometimes the
      // MediaRecorder) when the screen sleeps, so on return we re-acquire the lock,
      // resume the audio graph, and resume a recorder the OS paused.
      void acquireWakeLock();
      if (typeof document !== 'undefined') {
        onVisibility = () => {
          if (document.visibilityState !== 'visible' || !running) return;
          void acquireWakeLock();
          try {
            if (audioCtx && audioCtx.state === 'suspended') void audioCtx.resume();
          } catch {
            /* ignore */
          }
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
        elapsedMs += step;
        // Prefer the REAL measured level; keep a floor so the waveform still reads
        // as "live" for very quiet speech. Fall back to the synthesized signal only
        // when metering is unavailable.
        const measured = realLevel();
        if (measured != null) realPeak = Math.max(realPeak, measured);
        const amplitude =
          measured != null ? Math.min(1, Math.max(0.06, measured * 3)) : synthAmplitude(elapsedMs);
        if (elapsedMs % 500 === 0) peaks.push(Number(amplitude.toFixed(3)));
        onTick({ elapsedSeconds: Math.floor(elapsedMs / 1000), amplitude });
      }, step);
    },

    pause() {
      running = false;
      releaseWakeLock();
      try {
        recorder?.state === 'recording' && recorder.pause();
      } catch {
        /* ignore */
      }
    },

    resume() {
      running = true;
      void acquireWakeLock();
      try {
        recorder?.state === 'paused' && recorder.resume();
      } catch {
        /* ignore */
      }
    },

    async stop(): Promise<RecorderResult> {
      running = false;
      releaseWakeLock();
      const meteredReal = realMeter;
      const measuredPeak = realPeak;
      teardownMeter();
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
        // Only trustworthy when we actually captured a real stream AND metered it.
        capturedReal,
        peakLevel: capturedReal && meteredReal ? measuredPeak : undefined,
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
