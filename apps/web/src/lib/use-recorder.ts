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
    const a = getAdapter();
    const result = await a.stop();
    const state = useRecorderStore.getState();
    const session = await services.auth.getSession();
    if (!session) {
      state.reset();
      return null;
    }
    const meeting = await services.meetings.create({
      workspaceId: session.workspace.id,
      ownerId: session.user.id,
      title: state.title || 'Nova gravação',
      source: 'recording',
      meetingLanguage: state.meetingLanguage,
      durationSeconds: result.durationSeconds,
      recording: {
        durationSeconds: result.durationSeconds,
        audioRef: result.audioRef,
        waveformPeaks: result.waveformPeaks,
        source: 'recording',
      },
    });
    state.reset();
    router.push(`/app/meetings/${meeting.id}/processing`);
    return meeting;
  }, [services, router]);

  return { ...store, requestPermission, start, pause, resume, addMarker, finish };
}
