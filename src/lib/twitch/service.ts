import { twitchClient } from './client';
import { mapHelixStreamToLiveStatus, type TwitchLiveStatus } from './mapper';

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  value: TwitchLiveStatus;
  fetchedAt: number;
}

// In-memory cache. On serverless platforms this only helps within a warm
// instance, but that's enough to avoid hammering Twitch on every page view.
let cache: CacheEntry | null = null;
let inFlight: Promise<TwitchLiveStatus> | null = null;

async function fetchLiveStatus(): Promise<TwitchLiveStatus> {
  const username = process.env.TWITCH_USERNAME;
  if (!username) {
    throw new Error('Missing TWITCH_USERNAME environment variable.');
  }

  const stream = await twitchClient.getStreamByLogin(username);
  return mapHelixStreamToLiveStatus(stream);
}

export const twitchService = {
  /**
   * Returns whether the configured channel is currently live, with a short
   * TTL cache so repeated page loads don't each hit the Twitch API.
   */
  async getLiveStatus(): Promise<TwitchLiveStatus> {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return cache.value;
    }

    if (inFlight) {
      return inFlight;
    }

    inFlight = fetchLiveStatus()
      .then((value) => {
        cache = { value, fetchedAt: Date.now() };
        return value;
      })
      .finally(() => {
        inFlight = null;
      });

    try {
      return await inFlight;
    } catch (err) {
      // Fail soft: if Twitch is unreachable, treat the channel as offline
      // rather than breaking the homepage.
      console.error('Failed to fetch Twitch live status', err);
      return { isLive: false };
    }
  },
};
