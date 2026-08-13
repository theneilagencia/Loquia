'use client';
import { useEffect, useState } from 'react';
import { useLocalMediaStore } from './provider';
import type { LocalMediaAsset } from './types';

export type AudioSource = 'local' | 'remote' | 'none';

export interface ResolvedAudio {
  /** Where the playable audio comes from. */
  source: AudioSource;
  /** Object URL for local playback (revoked on cleanup); undefined for remote/none. */
  localUrl?: string;
  asset: LocalMediaAsset | null;
  /** True once resolution has run (so the UI can distinguish "loading" from "none"). */
  resolved: boolean;
}

/**
 * Local First playback resolver (§16/§17). Prefers the on-device recording: when a
 * local asset exists it returns a blob object URL and NO remote presigned GET is
 * needed. When there is no local copy, the caller may fall back to a still-present
 * temporary remote URL, and otherwise show the honest "stored on another device"
 * state (§18/§45).
 */
export function useLocalAudio(meetingId: string | undefined, workspaceId: string | undefined): ResolvedAudio {
  const store = useLocalMediaStore(workspaceId);
  const [state, setState] = useState<ResolvedAudio>({ source: 'none', asset: null, resolved: false });

  useEffect(() => {
    if (!store || !meetingId) return;
    let active = true;
    let url: string | undefined;
    (async () => {
      const asset = store.getByMeeting(meetingId);
      if (asset && (await store.exists(asset.id))) {
        const blob = await store.getBlob(asset.id);
        if (blob && active) {
          url = URL.createObjectURL(blob);
          setState({ source: 'local', localUrl: url, asset, resolved: true });
          return;
        }
      }
      if (active) setState({ source: 'none', asset: null, resolved: true });
    })();
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [store, meetingId]);

  return state;
}

/** Build a stable, human download filename: loquia-<slug>-<YYYY-MM-DD>.<ext>. */
export function downloadFilename(title: string, mimeExt: string, when = new Date()): string {
  const slug = (title || 'gravacao')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'gravacao';
  const date = when.toISOString().slice(0, 10);
  return `loquia-${slug}-${date}.${mimeExt}`;
}
