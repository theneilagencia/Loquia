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

  const finish = useCallback(async () => {
    // 1) Finalize the recording — a REAL captured Blob (or deterministic fallback).
    const result = await getAdapter().stop();
    const state = useRecorderStore.getState();
    const blob = result.blob ?? new Blob([new Uint8Array(2048)], { type: 'audio/webm' });
    const mimeType = result.mimeType ?? blob.type ?? 'audio/webm';
    const filename = `recording.${extensionForMime(mimeType)}`;
    const durationSeconds = result.durationSeconds || Math.round(state.elapsedSeconds ?? 0);

    // 2) Create the meeting + a temporary remote processing intent.
    const intent = await services.media.uploadIntent({
      title: state.title || 'Nova gravação',
      source: 'recording',
      meetingLanguage: state.meetingLanguage,
      filename,
      mimeType,
      sizeBytes: blob.size,
      durationSeconds,
    });
    if (!intent.ok) {
      // The recording is still in hand — surface the failure, keep the blob.
      useRecorderStore.getState().setError('upload_intent_failed');
      return null;
    }
    const meetingId = intent.value.meetingId;

    // 3) Local First: persist the recording ON DEVICE and confirm it before we
    //    ever send a copy off for processing (§7). This is the primary copy.
    let localAssetId: string | null = null;
    try {
      const session = await services.auth.getSession();
      if (session) {
        const localStore = await getLocalMediaStore(session.workspace.id);
        const asset = await localStore.save({ meetingId, blob, filename, mimeType, durationMs: durationSeconds * 1000 });
        const persisted = await localStore.exists(asset.id);
        localAssetId = persisted ? asset.id : null;
        if (persisted) await localStore.patch(asset.id, { processingUploadStatus: 'uploading', remoteProcessingAssetId: intent.value.mediaAssetId });
      }
    } catch (err) {
      if (err instanceof LocalMediaQuotaError) {
        // Out of device space — the blob is not persisted; tell the user (§13).
        useRecorderStore.getState().setError('local_quota_exceeded');
        return null;
      }
      // Non-fatal: continue with remote processing even if local persistence failed.
    }

    // 4) Send the temporary copy for processing (real presigned PUT; empty in mock).
    let uploadOk = true;
    if (intent.value.uploadUrl) {
      uploadOk = await fetch(intent.value.uploadUrl, { method: 'PUT', headers: intent.value.requiredHeaders, body: blob })
        .then((r) => r.ok)
        .catch(() => false);
    }

    if (!uploadOk) {
      // §38: the on-device recording is safe; processing can be retried (§39).
      if (localAssetId) {
        const session = await services.auth.getSession();
        if (session) {
          const localStore = await getLocalMediaStore(session.workspace.id);
          await localStore.patch(localAssetId, { processingUploadStatus: 'failed', status: 'available' });
          useRecorderStore.getState().setPendingUpload({ meetingId, localAssetId, workspaceId: session.workspace.id, filename, mimeType });
        }
      }
      useRecorderStore.getState().setError('processing_upload_failed');
      return null;
    }

    // 5) Confirm the upload → enqueue processing.
    await services.media.completeUpload(intent.value.mediaAssetId);
    if (localAssetId) {
      const session = await services.auth.getSession();
      if (session) {
        const localStore = await getLocalMediaStore(session.workspace.id);
        await localStore.patch(localAssetId, { processingUploadStatus: 'uploaded', status: 'processing' });
      }
    }
    state.reset();
    router.push(`/app/meetings/${meetingId}/processing`);
    return meetingId;
  }, [services, router]);

  /** Retry a failed processing upload from the on-device recording (§39). */
  const retryProcessing = useCallback(async () => {
    const pending = useRecorderStore.getState().pendingUpload;
    if (!pending) return null;
    const localStore = await getLocalMediaStore(pending.workspaceId);
    const blob = await localStore.getBlob(pending.localAssetId);
    if (!blob) {
      useRecorderStore.getState().setError('processing_upload_failed');
      return null;
    }
    const intent = await services.media.reprocessIntent({ meetingId: pending.meetingId, filename: pending.filename, mimeType: pending.mimeType, sizeBytes: blob.size });
    if (!intent.ok) {
      useRecorderStore.getState().setError('processing_upload_failed');
      return null;
    }
    await localStore.patch(pending.localAssetId, { processingUploadStatus: 'uploading', remoteProcessingAssetId: intent.value.mediaAssetId });
    let uploadOk = true;
    if (intent.value.uploadUrl) {
      uploadOk = await fetch(intent.value.uploadUrl, { method: 'PUT', headers: intent.value.requiredHeaders, body: blob })
        .then((r) => r.ok)
        .catch(() => false);
    }
    if (!uploadOk) {
      await localStore.patch(pending.localAssetId, { processingUploadStatus: 'failed' });
      useRecorderStore.getState().setError('processing_upload_failed');
      return null;
    }
    await services.media.completeUpload(intent.value.mediaAssetId);
    await localStore.patch(pending.localAssetId, { processingUploadStatus: 'uploaded', status: 'processing' });
    useRecorderStore.getState().reset();
    router.push(`/app/meetings/${pending.meetingId}/processing`);
    return pending.meetingId;
  }, [services, router]);

  return { ...store, requestPermission, start, pause, resume, addMarker, finish, retryProcessing };
}
