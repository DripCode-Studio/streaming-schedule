import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * All Stream.startTime / endTime values are stored in UTC (as Date/timestamptz
 * in Postgres). `timezone` on the Stream/RecurringSchedule records is the
 * *streamer's* home timezone, used to render "as scheduled" times. Visitors
 * can additionally view times in their own browser timezone client-side.
 */

export function formatInZone(date: Date, timeZone: string, pattern: string): string {
  return formatInTimeZone(date, timeZone, pattern);
}

export function toZoned(date: Date, timeZone: string): Date {
  return toZonedTime(date, timeZone);
}

/**
 * Converts a `<input type="datetime-local">` value (a wall-clock time with no
 * timezone info) into the correct UTC instant, treating that wall-clock time
 * as being in `timeZone` — e.g. admin enters "06:00" for a stream whose
 * timezone is America/Toronto, and this returns the correct UTC Date.
 */
export function localInputToUtc(dateTimeLocal: string, timeZone: string): Date {
  return fromZonedTime(dateTimeLocal, timeZone);
}

/** Formats a UTC Date back into a `<input type="datetime-local">` value, in the given timezone. */
export function utcToLocalInput(date: Date, timeZone: string): string {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd'T'HH:mm");
}

export function guessBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/** Human "starts in 2 days" / "finished 7 hours ago" style relative label. */
export function relativeLabel(date: Date, now: Date = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  const isFuture = diffMs >= 0;
  const abs = Math.abs(diffMs);

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  let amount: number;
  let unit: string;

  if (abs < hour) {
    amount = Math.max(1, Math.round(abs / minute));
    unit = amount === 1 ? 'minute' : 'minutes';
  } else if (abs < day) {
    amount = Math.round(abs / hour);
    unit = amount === 1 ? 'hour' : 'hours';
  } else {
    amount = Math.round(abs / day);
    unit = amount === 1 ? 'day' : 'days';
  }

  return isFuture ? `starts in ${amount} ${unit}` : `finished ${amount} ${unit} ago`;
}

/** "1h 24m" style elapsed duration, used for an in-progress live stream. */
export function elapsedLabel(startedAt: Date, now: Date = new Date()): string {
  const diffMs = Math.max(0, now.getTime() - startedAt.getTime());
  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/** "17h 24m 31s" countdown components for a future date. */
export function countdownParts(target: Date, now: Date = new Date()) {
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isPast: diffMs <= 0,
  };
}
