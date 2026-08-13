'use client';

import { create } from 'zustand';
import type { RecorderPermissionState, RecorderRunState } from '@loquia/contracts';

/**
 * Transient recorder state (task spec §24). Kept in a Zustand store — NOT tied
 * to the /record route — so a persistent mini-recorder can survive navigation
 * while a recording is in progress. This is genuinely transient UI state, the
 * one place the spec sanctions Zustand.
 */
interface RecorderState {
  runState: RecorderRunState;
  permission: RecorderPermissionState;
  elapsedSeconds: number;
  amplitude: number;
  liveWaveform: number[];
  markers: number[];
  title: string;
  meetingLanguage: string;
  /** Set when finishing/uploading fails, so the recording isn't silently lost (§13/§38). */
  error: 'upload_intent_failed' | 'local_quota_exceeded' | 'processing_upload_failed' | null;
  /** Context to retry a failed processing upload from the on-device copy (§39). */
  pendingUpload: { meetingId: string; localAssetId: string; workspaceId: string; filename: string; mimeType: string } | null;
  setPermission: (p: RecorderPermissionState) => void;
  setError: (e: RecorderState['error']) => void;
  setPendingUpload: (p: RecorderState['pendingUpload']) => void;
  start: (title: string, meetingLanguage: string) => void;
  tick: (elapsedSeconds: number, amplitude: number) => void;
  pause: () => void;
  resume: () => void;
  addMarker: () => void;
  stop: () => void;
  reset: () => void;
}

export const useRecorderStore = create<RecorderState>((set) => ({
  runState: 'idle',
  permission: 'permission_unknown',
  elapsedSeconds: 0,
  amplitude: 0,
  liveWaveform: [],
  markers: [],
  title: '',
  meetingLanguage: 'pt-BR',
  error: null,
  pendingUpload: null,
  setPermission: (permission) => set({ permission }),
  setError: (error) => set({ error }),
  setPendingUpload: (pendingUpload) => set({ pendingUpload }),
  start: (title, meetingLanguage) =>
    set({
      runState: 'recording',
      elapsedSeconds: 0,
      liveWaveform: [],
      markers: [],
      amplitude: 0,
      title,
      meetingLanguage,
      error: null,
    }),
  tick: (elapsedSeconds, amplitude) =>
    set((state) => ({
      elapsedSeconds,
      amplitude,
      liveWaveform: [...state.liveWaveform.slice(-119), amplitude],
    })),
  pause: () => set({ runState: 'paused' }),
  resume: () => set({ runState: 'recording' }),
  addMarker: () => set((state) => ({ markers: [...state.markers, state.elapsedSeconds] })),
  stop: () => set({ runState: 'stopped' }),
  reset: () =>
    set({
      runState: 'idle',
      elapsedSeconds: 0,
      amplitude: 0,
      liveWaveform: [],
      markers: [],
      title: '',
      error: null,
      pendingUpload: null,
    }),
}));
