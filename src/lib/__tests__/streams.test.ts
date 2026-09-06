import { describe, it, expect } from 'vitest';
import {
  sortUpcoming,
  sortPast,
  pickNextStream,
  pickInProgressStream,
  resolveHomepageState,
  type StreamLike,
} from '../streams';

const NOW = new Date('2026-09-06T12:00:00Z');

function stream(overrides: Partial<StreamLike>): StreamLike {
  return {
    id: overrides.id ?? Math.random().toString(36),
    title: overrides.title ?? 'Untitled',
    slug: overrides.slug ?? 'untitled',
    status: overrides.status ?? 'SCHEDULED',
    startTime: overrides.startTime ?? NOW,
    endTime: overrides.endTime ?? null,
  };
}

describe('sortUpcoming', () => {
  it('returns only future, non-draft, non-cancelled streams, soonest first', () => {
    const streams = [
      stream({ id: 'far', startTime: new Date('2026-09-10T00:00:00Z') }),
      stream({ id: 'near', startTime: new Date('2026-09-07T00:00:00Z') }),
      stream({ id: 'past', startTime: new Date('2026-09-01T00:00:00Z') }),
      stream({ id: 'draft', startTime: new Date('2026-09-08T00:00:00Z'), status: 'DRAFT' }),
      stream({ id: 'cancelled', startTime: new Date('2026-09-08T00:00:00Z'), status: 'CANCELLED' }),
    ];

    const result = sortUpcoming(streams, NOW);

    expect(result.map((s) => s.id)).toEqual(['near', 'far']);
  });
});

describe('sortPast', () => {
  it('returns only past, non-draft streams, most recent first', () => {
    const streams = [
      stream({ id: 'oldest', startTime: new Date('2026-08-01T00:00:00Z') }),
      stream({ id: 'recent', startTime: new Date('2026-09-05T00:00:00Z') }),
      stream({ id: 'future', startTime: new Date('2026-09-10T00:00:00Z') }),
      stream({ id: 'draft', startTime: new Date('2026-08-15T00:00:00Z'), status: 'DRAFT' }),
    ];

    const result = sortPast(streams, NOW);

    expect(result.map((s) => s.id)).toEqual(['recent', 'oldest']);
  });

  it('keeps cancelled streams in their chronological position', () => {
    const streams = [
      stream({ id: 'cancelled', startTime: new Date('2026-09-05T00:00:00Z'), status: 'CANCELLED' }),
      stream({ id: 'completed', startTime: new Date('2026-09-04T00:00:00Z'), status: 'COMPLETED' }),
    ];

    const result = sortPast(streams, NOW);

    expect(result.map((s) => s.id)).toEqual(['cancelled', 'completed']);
  });
});

describe('pickNextStream', () => {
  it('returns the soonest upcoming stream', () => {
    const streams = [
      stream({ id: 'far', startTime: new Date('2026-09-10T00:00:00Z') }),
      stream({ id: 'near', startTime: new Date('2026-09-07T00:00:00Z') }),
    ];

    expect(pickNextStream(streams, NOW)?.id).toBe('near');
  });

  it('returns null when nothing is scheduled', () => {
    const streams = [stream({ id: 'past', startTime: new Date('2026-09-01T00:00:00Z') })];
    expect(pickNextStream(streams, NOW)).toBeNull();
  });
});

describe('pickInProgressStream', () => {
  it('finds a SCHEDULED stream whose window contains now', () => {
    const streams = [
      stream({
        id: 'in-progress',
        startTime: new Date('2026-09-06T11:00:00Z'),
        endTime: new Date('2026-09-06T15:00:00Z'),
      }),
      stream({ id: 'later', startTime: new Date('2026-09-07T00:00:00Z') }),
    ];

    expect(pickInProgressStream(streams, NOW)?.id).toBe('in-progress');
  });

  it('returns null when no stream window contains now', () => {
    const streams = [
      stream({
        id: 'past',
        startTime: new Date('2026-09-06T01:00:00Z'),
        endTime: new Date('2026-09-06T05:00:00Z'),
      }),
    ];

    expect(pickInProgressStream(streams, NOW)).toBeNull();
  });
});

describe('resolveHomepageState', () => {
  it('resolves to offline with the next stream when Twitch reports offline', () => {
    const streams = [stream({ id: 'next', startTime: new Date('2026-09-07T00:00:00Z') })];

    const state = resolveHomepageState(streams, { isLive: false }, NOW);

    expect(state.kind).toBe('offline');
    if (state.kind === 'offline') {
      expect(state.nextStream?.id).toBe('next');
    }
  });

  it('resolves to live and attaches the matching in-progress DB stream when Twitch is live', () => {
    const streams = [
      stream({
        id: 'live-match',
        startTime: new Date('2026-09-06T11:00:00Z'),
        endTime: new Date('2026-09-06T15:00:00Z'),
      }),
    ];
    const twitch = {
      isLive: true as const,
      title: 'Live title',
      category: 'Software and Game Development',
      viewerCount: 42,
      startedAt: '2026-09-06T11:00:00Z',
      thumbnailUrl: 'https://example.com/thumb.jpg',
    };

    const state = resolveHomepageState(streams, twitch, NOW);

    expect(state.kind).toBe('live');
    if (state.kind === 'live') {
      expect(state.stream?.id).toBe('live-match');
      expect(state.twitch.viewerCount).toBe(42);
    }
  });

  it('resolves to live with a null stream when Twitch is live but nothing matches in the DB', () => {
    const state = resolveHomepageState(
      [],
      {
        isLive: true,
        title: 'Live title',
        category: 'Just Chatting',
        viewerCount: 10,
        startedAt: '2026-09-06T11:30:00Z',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      },
      NOW
    );

    expect(state.kind).toBe('live');
    if (state.kind === 'live') {
      expect(state.stream).toBeNull();
    }
  });
});
