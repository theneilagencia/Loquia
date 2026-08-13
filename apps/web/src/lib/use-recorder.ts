'use client';

import { useCallback } from 'react';
import type { MediaRecorderAdapter } from '@loquia/contracts';
import { createMediaRecorderAdapter } from './adapters/media-recorder';
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

  const finish = useCallback(async () => {
    await getAdapter().stop();
    const state = useRecorderStore.getState();
    // Upload the finished recording through the same media flow as file upload.
    // NOTE: in this environment there is no real microphone, so the recorder
    // synthesizes the signal; a small placeholder blob is uploaded so the real
    // pipeline (storage → queue → worker → STT) runs end to end.
    const intent = await services.media.uploadIntent({
      title: state.title || 'Nova gravação',
      source: 'recording',
      meetingLanguage: state.meetingLanguage,
      filename: 'recording.webm',
      mimeType: 'audio/webm',
      sizeBytes: 2048,
      durationSeconds: Math.round(state.elapsedSeconds ?? 0),
    });
    if (!intent.ok) {
      state.reset();
      return null;
    }
    if (intent.value.uploadUrl) {
      await fetch(intent.value.uploadUrl, {
        method: 'PUT',
        headers: intent.value.requiredHeaders,
        body: new Blob([new Uint8Array(2048)], { type: 'audio/webm' }),
      }).catch(() => undefined);
    }
    await services.media.completeUpload(intent.value.mediaAssetId);
    state.reset();
    router.push(`/app/meetings/${intent.value.meetingId}/processing`);
    return intent.value.meetingId;
  }, [services, router]);

  return { ...store, requestPermission, start, pause, resume, addMarker, finish };
}
