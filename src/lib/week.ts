import { startOfWeek, addDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import type { StreamLike } from './streams';

/**
 * Helpers for rendering a Monday–Sunday weekly calendar view. Week boundaries
 * and day grouping are computed in `timeZone` (the streamer's home timezone),
 * so a stream at 10pm Sunday local time lands on Sunday, regardless of which
 * UTC weekday the underlying Date instant falls on.
 */

export interface WeekDay {
  /** One-based index into the week: 0 = Monday ... 6 = Sunday. */
  dayIndex: number;
  /** Midnight wall-clock on that day, expressed in `timeZone`. */
  date: Date;
  /** `yyyy-MM-dd` in `timeZone` — the key streams are grouped by. */
  isoDate: string;
  /** Short weekday label, e.g. "Mon". */
  label: string;
  /** Zero-padded month day, e.g. "07". */
  dayOfMonth: string;
  /** Zero-padded month number of the day, e.g. "09". */
  month: string;
}

/** The seven days of the week containing `now`, starting Monday. */
export function getWeekDays(now: Date, timeZone: string): WeekDay[] {
  const monday = startOfWeek(toZonedTime(now, timeZone), { weekStartsOn: 1 });

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return {
      dayIndex: i,
      date,
      isoDate: formatInTimeZone(date, timeZone, 'yyyy-MM-dd'),
      label: formatInTimeZone(date, timeZone, 'EEE'),
      dayOfMonth: formatInTimeZone(date, timeZone, 'dd'),
      month: formatInTimeZone(date, timeZone, 'LLL'),
    };
  });
}

/** Buckets visible streams into the provided week days, keyed by `dayIndex`. */
export function groupStreamsByWeekDay(
  streams: StreamLike[],
  weekDays: WeekDay[],
  timeZone: string
): Record<number, StreamLike[]> {
  const bound = streams.filter((s) => s.status !== 'DRAFT' && s.status !== 'CANCELLED');
  const bucketOf = new Map(weekDays.map((d) => [d.isoDate, d.dayIndex]));
  const buckets: Record<number, StreamLike[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  for (const s of bound) {
    const iso = formatInTimeZone(s.startTime, timeZone, 'yyyy-MM-dd');
    const day = bucketOf.get(iso);
    if (day !== undefined) buckets[day].push(s);
  }

  for (const day of weekDays) {
    buckets[day.dayIndex].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  return buckets;
}

/** The `dayIndex` (0 = Monday) of `now` in `timeZone`; negative if the week can't be computed. */
export function todayIndex(now: Date, timeZone: string): number {
  return (Number(formatInTimeZone(now, timeZone, 'i')) || 7) - 1;
}