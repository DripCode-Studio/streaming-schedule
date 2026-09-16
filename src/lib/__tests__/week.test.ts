import { describe, it, expect } from 'vitest';
import { getWeekDays, groupStreamsByWeekDay, todayIndex } from '../week';
import type { StreamLike } from '../streams';

const NOW = new Date('2026-09-16T12:00:00Z');
const TZ = 'America/Toronto';
const WEEK_START = '2026-09-14'; // Monday
const WEEK_END = '2026-09-20'; // Sunday

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

describe('getWeekDays', () => {
  it('returns Monday through Sunday for the current week', () => {
    const days = getWeekDays(NOW, TZ);

    expect(days).toHaveLength(7);
    expect(days[0].dayIndex).toBe(0);
    expect(days[6].dayIndex).toBe(6);
    expect(days[0].isoDate).toBe(WEEK_START);
    expect(days[6].isoDate).toBe(WEEK_END);
    expect(days[0].label).toBe('Mon');
    expect(days.map((d) => d.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('groups streams that cross a UTC midnight into their local week day', () => {
    // 10pm Toronto on Sunday Sep 20 is 02:00Z Monday Sep 21.
    const lateSunday = new Date('2026-09-21T02:00:00Z');
    const days = getWeekDays(lateSunday, TZ);
    expect(days.map((d) => d.isoDate)).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ]);
  });
});

describe('groupStreamsByWeekDay', () => {
  it('buckets streams into their local weekday', () => {
    const streams = [
      stream({ id: 'monday', startTime: new Date('2026-09-14T15:00:00Z') }),
      stream({ id: 'late-sunday-utc', startTime: new Date('2026-09-21T02:00:00Z') }),
      stream({ id: 'midweek', startTime: new Date('2026-09-17T12:00:00Z') }),
    ];

    const buckets = groupStreamsByWeekDay(streams, getWeekDays(NOW, TZ), TZ);

    expect(buckets[0].map((s) => s.id)).toEqual(['monday']);
    expect(buckets[6].map((s) => s.id)).toEqual(['late-sunday-utc']);
    expect(buckets[3].map((s) => s.id)).toEqual(['midweek']);
  });

  it('sorts each day soonest first and excludes draft/cancelled', () => {
    const streams = [
      stream({ id: 'twice', startTime: new Date('2026-09-14T20:00:00Z') }),
      stream({ id: 'once', startTime: new Date('2026-09-14T15:00:00Z') }),
      stream({ id: 'draft', startTime: new Date('2026-09-14T10:00:00Z'), status: 'DRAFT' }),
      stream({ id: 'cancelled', startTime: new Date('2026-09-14T09:00:00Z'), status: 'CANCELLED' }),
      stream({ id: 'outside', startTime: new Date('2026-09-30T12:00:00Z') }),
    ];

    const buckets = groupStreamsByWeekDay(streams, getWeekDays(NOW, TZ), TZ);

    expect(buckets[0].map((s) => s.id)).toEqual(['once', 'twice']);
    expect(Object.values(buckets).flat().map((s) => s.id)).not.toContain('outside');
  });

  it('returns empty arrays for days without streams', () => {
    const buckets = groupStreamsByWeekDay([], getWeekDays(NOW, TZ), TZ);

    expect(buckets[0]).toEqual([]);
    expect(Object.values(buckets).every((b) => b.length === 0)).toBe(true);
  });
});

describe('todayIndex', () => {
  it('returns 0 for Monday', () => {
    expect(todayIndex(new Date('2026-09-14T12:00:00Z'), TZ)).toBe(0);
  });

  it('returns 2 for Wednesday', () => {
    expect(todayIndex(new Date('2026-09-16T12:00:00Z'), TZ)).toBe(2);
  });

  it('returns 6 for Sunday', () => {
    expect(todayIndex(new Date('2026-09-20T12:00:00Z'), TZ)).toBe(6);
  });
});