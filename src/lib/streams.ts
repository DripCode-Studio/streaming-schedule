import type { TwitchLiveStatus } from './twitch/mapper';

// Minimal shape our pure logic needs — decoupled from the Prisma model so
// these functions stay easy to unit test without a database.
export interface StreamLike {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  startTime: Date;
  endTime: Date | null;
}

/** Future, visible (non-draft, non-cancelled) streams, soonest first. */
export function sortUpcoming<T extends StreamLike>(streams: T[], now: Date = new Date()): T[] {
  return streams
    .filter((s) => s.status !== 'DRAFT' && s.status !== 'CANCELLED')
    .filter((s) => s.startTime.getTime() > now.getTime())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/** Past streams, most recent first. Cancelled streams stay in place but callers decide how to render them. */
export function sortPast<T extends StreamLike>(streams: T[], now: Date = new Date()): T[] {
  return streams
    .filter((s) => s.status !== 'DRAFT')
    .filter((s) => s.startTime.getTime() <= now.getTime())
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

/** The single soonest upcoming stream, or null if nothing is scheduled. */
export function pickNextStream<T extends StreamLike>(streams: T[], now: Date = new Date()): T | null {
  const upcoming = sortUpcoming(streams, now);
  return upcoming[0] ?? null;
}

/** A DB stream currently "in progress" by its own schedule (used to enrich the live banner). */
export function pickInProgressStream<T extends StreamLike>(streams: T[], now: Date = new Date()): T | null {
  const nowMs = now.getTime();
  const candidates = streams.filter((s) => {
    if (s.status === 'CANCELLED' || s.status === 'DRAFT') return false;
    if (s.status === 'LIVE') return true;
    const end = s.endTime?.getTime() ?? s.startTime.getTime() + 4 * 60 * 60 * 1000; // assume 4h if unset
    return s.startTime.getTime() <= nowMs && nowMs <= end;
  });
  // If several match (shouldn't normally happen), prefer the most recently started.
  candidates.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  return candidates[0] ?? null;
}

export type HomepageState<T extends StreamLike> =
  | { kind: 'live'; stream: T | null; twitch: Extract<TwitchLiveStatus, { isLive: true }> }
  | { kind: 'offline'; nextStream: T | null };

/**
 * Centralizes the "is Twitch live?" vs "what does the DB say?" decision so
 * the homepage (and any other page) always resolves state the same way.
 * Twitch is the source of truth for *whether* we're live right now; the
 * database is the source of truth for everything else about the stream.
 */
export function resolveHomepageState<T extends StreamLike>(
  streams: T[],
  twitchStatus: TwitchLiveStatus,
  now: Date = new Date()
): HomepageState<T> {
  if (twitchStatus.isLive) {
    return {
      kind: 'live',
      stream: pickInProgressStream(streams, now),
      twitch: twitchStatus,
    };
  }

  return {
    kind: 'offline',
    nextStream: pickNextStream(streams, now),
  };
}
