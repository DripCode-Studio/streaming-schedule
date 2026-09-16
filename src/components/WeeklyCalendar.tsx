import { formatInTimeZone } from 'date-fns-tz';
import { getWeekDays, groupStreamsByWeekDay, todayIndex } from '@/lib/week';
import { siteConfig } from '@/lib/config';
import type { StreamLike } from '@/lib/streams';

interface WeeklyCalendarProps {
  /** Streams to lay out across the week (the homepage's non-draft list). */
  streams: StreamLike[];
  now?: Date;
  timeZone?: string;
}

export function WeeklyCalendar({ streams, now = new Date(), timeZone = siteConfig.streamerTimezone }: WeeklyCalendarProps) {
  const days = getWeekDays(now, timeZone);
  const buckets = groupStreamsByWeekDay(streams, days, timeZone);
  const today = todayIndex(now, timeZone);

  return (
    <section className="overflow-hidden rounded border border-border bg-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pb-4 pt-5">
        <h2 className="font-mono text-xs uppercase tracking-wide text-muted">
          This week · {formatInTimeZone(days[0].date, timeZone, 'MMM d')} –{' '}
          {formatInTimeZone(days[6].date, timeZone, 'MMM d, yyyy')}
        </h2>
        <p className="font-mono text-xs text-faint">times in {formatInTimeZone(now, timeZone, 'zzz')}</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[52rem]">
          <div className="grid grid-cols-7">
            {days.map((day) => (
              <div key={day.isoDate} className={`px-3 pb-3 pt-1 ${day.dayIndex !== 0 ? 'border-l border-border' : ''}`}>
                <p
                  className={`font-mono text-xs uppercase tracking-wide ${
                    day.dayIndex === today ? 'text-accent' : 'text-faint'
                  }`}
                >
                  {day.label}
                </p>
                <p className={`mt-0.5 font-mono text-sm ${day.dayIndex === today ? 'text-ink' : 'text-muted'}`}>
                  {day.month} {day.dayOfMonth}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-t border-border">
            {days.map((day) => {
              const dayStreams = buckets[day.dayIndex];
              return (
                <div
                  key={day.isoDate}
                  className={`min-h-[8rem] px-2 pb-3 pt-1 ${day.dayIndex !== 0 ? 'border-l border-border' : ''} ${
                    day.dayIndex === today ? 'bg-accent-dim/40' : ''
                  }`}
                >
                  {dayStreams.length === 0 ? (
                    <p className="px-1 pt-2 text-center font-mono text-xs text-faint">—</p>
                  ) : (
                    <div className="flex flex-col gap-2.5 px-1 pt-2">
                      {dayStreams.map((s) => {
                        const isPast = s.startTime.getTime() <= now.getTime();
                        const isLive = s.status === 'LIVE';
                        return (
                          <div key={s.id} className={isPast ? 'opacity-45' : ''}>
                            <p className={`font-mono text-xs ${isLive ? 'text-accent' : 'text-accent'}`}>
                              {formatInTimeZone(s.startTime, timeZone, 'HH:mm')}
                              {isLive && (
                                <span className="ml-1.5 inline-flex items-center gap-1 text-accent">
                                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
                                  live
                                </span>
                              )}
                            </p>
                            <p className={`mt-0.5 text-sm leading-snug ${isPast ? 'text-faint' : 'text-ink'}`}>{s.title}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}