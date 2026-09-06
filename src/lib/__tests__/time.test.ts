import { describe, it, expect } from 'vitest';
import { localInputToUtc, utcToLocalInput, relativeLabel, elapsedLabel } from '../time';

describe('localInputToUtc / utcToLocalInput', () => {
  it('round-trips a wall-clock time through a timezone correctly (EDT, UTC-4)', () => {
    // Sep 7 2026 is during Eastern Daylight Time (UTC-4).
    const utc = localInputToUtc('2026-09-07T06:00', 'America/Toronto');
    expect(utc.toISOString()).toBe('2026-09-07T10:00:00.000Z');

    const roundTripped = utcToLocalInput(utc, 'America/Toronto');
    expect(roundTripped).toBe('2026-09-07T06:00');
  });

  it('handles a winter date correctly (EST, UTC-5)', () => {
    const utc = localInputToUtc('2026-01-15T06:00', 'America/Toronto');
    expect(utc.toISOString()).toBe('2026-01-15T11:00:00.000Z');
  });

  it('produces a different UTC instant for the same wall-clock time in a different timezone', () => {
    const toronto = localInputToUtc('2026-09-07T06:00', 'America/Toronto');
    const paris = localInputToUtc('2026-09-07T06:00', 'Europe/Paris');
    expect(toronto.getTime()).not.toBe(paris.getTime());
  });
});

describe('relativeLabel', () => {
  const now = new Date('2026-09-06T12:00:00Z');

  it('describes a future time as "starts in"', () => {
    expect(relativeLabel(new Date('2026-09-08T12:00:00Z'), now)).toBe('starts in 2 days');
  });

  it('describes a past time as "finished ... ago"', () => {
    expect(relativeLabel(new Date('2026-09-06T05:00:00Z'), now)).toBe('finished 7 hours ago');
  });
});

describe('elapsedLabel', () => {
  it('formats elapsed time as "1h 24m"', () => {
    const start = new Date('2026-09-06T10:36:00Z');
    const now = new Date('2026-09-06T12:00:00Z');
    expect(elapsedLabel(start, now)).toBe('1h 24m');
  });

  it('omits the hour segment when under an hour', () => {
    const start = new Date('2026-09-06T11:45:00Z');
    const now = new Date('2026-09-06T12:00:00Z');
    expect(elapsedLabel(start, now)).toBe('15m');
  });
});
