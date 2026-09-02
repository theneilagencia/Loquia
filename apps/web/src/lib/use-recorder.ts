'use client';

import { useCallback } from 'react';
import type { MediaRecorderAdapter } from '@loquia/contracts';
import { createMediaRecorderAdapter, extensionForMime } from './adapters/media-recorder';
import { getLocalMediaStore } from './local-media/provider';
import { LocalMediaQuotaError } from './local-media';
import { useRecorderStore } from './recorder-store';
import { useServices } from './services-context';
import { useRouter } from '@/i18n/navigation';

/** Module-level singleton so the recording survives route changes. */
let adapter: MediaRecorderAdapter | null = null;
function getAdapter(): MediaRecorderAdapter {
  if (!adapter) adapter = createMediaRecorderAdapter();
  return adapter;
}

export function useRecorder() {
  const store = useRecorderStore();
  const services = useServices();
  const router = useRouter();

  const requestPermission = useCallback(async () => {
    const state = await getAdapter().requestPermission();
    useRecorderStore.getState().setPermission(state);
    return state;
  }, []);

  const start = useCallback(
    async (title: string, meetingLanguage: string) => {
      const a = getAdapter();
      let permission = a.getPermissionState();
      if (permission !== 'permission_granted') {
        permission = await a.requestPermission();
        useRecorderStore.getState().setPermission(permission);
      }
      // In mock mode we proceed even without a real mic (synthesized capture).
      useRecorderStore.getState().start(title, meetingLanguage);
      await a.start((tick) => {
        useRecorderStore.getState().tick(tick.elapsedSeconds, tick.amplitude);
      });
    },
    [],
  );

  const pause = useCallback(() => {
    getAdapter().pause();
    useRecorderStore.getState().pause();
  }, []);

  const resume = useCallback(() => {
    getAdapter().resume();
    useRecorderStore.getState().resume();
  }, []);

  const addMarker = useCallback(() => {
    useRecorderStore.getState().addMarker();
  }, []);

  /** Send a finished recording for direct processing, then persist it on-device. */
  const sendForProcessing = useCallback(
    async (blob: Blob, mimeType: string, filename: string, durationSeconds: number, meetingLanguage: string, title: string) => {
      const res = await services.media.processAudio({ blob, title, source: 'recording', meetingLanguage, filename, mimeType, durationSeconds });
      if (!res.ok) {
        // Keep the recording in hand (§14) so the user can retry without re-recording.
        useRecorderStore.getState().setPendingBlob({ blob, mimeType, filename, durationSeconds, meetingLanguage });
        useRecorderStore.getState().setError('processing_upload_failed');
        return null;
      }
      const meetingId = res.value.meetingId;

      // Local First: the on-device recording is the primary copy — persist + confirm.
      try {
        const session = await services.auth.getSession();
        if (session) {
          const localStore = await getLocalMediaStore(session.workspace.id);
          const asset = await localStore.save({ meetingId, blob, filename, mimeType, durationMs: durationSeconds * 1000 });
          await localStore.patch(asset.id, { processingUploadStatus: 'uploaded', status: 'processing' });
        }
      } catch (err) {
        if (err instanceof LocalMediaQuotaError) {
          // Processing already started server-side; note the device is full (§13).
          useRecorderStore.getState().setError('local_quota_exceeded');
        }
        // Otherwise non-fatal: processing continues; the copy just isn't on this device.
      }

      useRecorderStore.getState().reset();
      router.push(`/app/meetings/${meetingId}/processing`);
      return meetingId;
    },
    [services, router],
  );

  const finish = useCallback(async () => {
    // Finalize the recording — a REAL captured Blob (or deterministic fallback).
    // We ALWAYS submit what was captured: the live level meter is guidance only and
    // must never block a recording (a suspended-context reading could be a false
    // zero). Genuinely silent audio is caught server-side with a clear 'no speech'
    // message + retry, so the user is never stuck unable to record.
    const result = await getAdapter().stop();
    const state = useRecorderStore.getState();
    const blob = result.blob ?? new Blob([new Uint8Array(2048)], { type: 'audio/webm' });
    const mimeType = result.mimeType ?? blob.type ?? 'audio/webm';
    const filename = `recording.${extensionForMime(mimeType)}`;
    const durationSeconds = result.durationSeconds || Math.round(state.elapsedSeconds ?? 0);
    return sendForProcessing(blob, mimeType, filename, durationSeconds, state.meetingLanguage, state.title || 'Nova gravação');
  }, [sendForProcessing]);

  /** Retry after a failed first attempt, reusing the retained recording (§13/§14). */
  const retryProcessing = useCallback(async () => {
    const pending = useRecorderStore.getState().pendingBlob;
    if (!pending) return null;
    return sendForProcessing(pending.blob, pending.mimeType, pending.filename, pending.durationSeconds, pending.meetingLanguage, useRecorderStore.getState().title || 'Nova gravação');
  }, [sendForProcessing]);

  return { ...store, requestPermission, start, pause, resume, addMarker, finish, retryProcessing };
}
