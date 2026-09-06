import type { HelixStream } from './client';

export interface LiveStreamInfo {
  isLive: true;
  title: string;
  category: string;
  viewerCount: number;
  startedAt: string; // ISO
  thumbnailUrl: string;
}

export interface OfflineInfo {
  isLive: false;
}

export type TwitchLiveStatus = LiveStreamInfo | OfflineInfo;

export function mapHelixStreamToLiveStatus(stream: HelixStream | null): TwitchLiveStatus {
  if (!stream || stream.type !== 'live') {
    return { isLive: false };
  }

  return {
    isLive: true,
    title: stream.title,
    category: stream.game_name,
    viewerCount: stream.viewer_count,
    startedAt: stream.started_at,
    // Helix returns a templated URL with {width}x{height} placeholders.
    thumbnailUrl: stream.thumbnail_url
      .replace('{width}', '1280')
      .replace('{height}', '720'),
  };
}
