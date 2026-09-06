import { db } from '@/lib/db';
import { twitchService } from '@/lib/twitch/service';
import { resolveHomepageState, sortUpcoming, sortPast } from '@/lib/streams';
import { siteConfig, twitchChannelUrl } from '@/lib/config';
import { TwitchPlayer } from '@/components/TwitchPlayer';
import { StreamCard } from '@/components/StreamCard';
import { Countdown } from '@/components/Countdown';
import { EmptyState } from '@/components/EmptyState';
import { elapsedLabel, formatInZone } from '@/lib/time';

export const revalidate = 30; // keep live state reasonably fresh without hitting Twitch on every request

export default async function HomePage() {
  const now = new Date();

  const streams = await db.stream.findMany({
    where: { status: { not: 'DRAFT' } },
    orderBy: { startTime: 'desc' },
    take: 200,
    include: { series: true, project: true },
  });

  const twitchStatus = await twitchService.getLiveStatus();
  const state = resolveHomepageState(streams, twitchStatus, now);

  const upcoming = sortUpcoming(streams, now);
  const past = sortPast(streams, now);

  return (
    <div className="mx-auto max-w-content px-6 py-16">
      <header className="mb-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Schedule</h1>
        <p className="mt-2 text-sm text-muted">
          for{' '}
          <a href={twitchChannelUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            twitch.tv/{siteConfig.twitchUsername}
          </a>{' '}
          streams
        </p>
      </header>

      {state.kind === 'live' ? (
        <section className="mb-16" aria-labelledby="live-heading">
          <h2 id="live-heading" className="mb-4 font-mono text-xs uppercase tracking-wide text-accent">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Live now
          </h2>

          <TwitchPlayer channel={siteConfig.twitchUsername} />

          <div className="mt-5">
            <h3 className="text-lg font-medium text-ink">
              {state.stream?.title ?? state.twitch.title}
            </h3>
            {state.stream?.series && (
              <p className="mt-1 text-sm text-muted">{state.stream.series.name}</p>
            )}
            <p className="mt-3 font-mono text-xs text-muted">
              {state.stream?.category ?? state.twitch.category} · started{' '}
              {elapsedLabel(new Date(state.twitch.startedAt))} ago
            </p>
            <a
              href={twitchChannelUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block font-mono text-sm text-accent hover:underline"
            >
              Watch on Twitch →
            </a>
          </div>
        </section>
      ) : (
        <section className="mb-16" aria-labelledby="offline-heading">
          <h2 id="offline-heading" className="mb-4 font-mono text-xs uppercase tracking-wide text-faint">
            Currently offline
          </h2>

          {state.nextStream ? (
            <div className="rounded border border-border-strong bg-panel px-6 py-6">
              <p className="font-mono text-xs uppercase tracking-wide text-accent">Next stream</p>
              <h3 className="mt-2 text-xl font-medium text-ink">{state.nextStream.title}</h3>
              <p className="mt-2 text-sm text-muted">
                {formatInZone(state.nextStream.startTime, state.nextStream.timezone, 'EEEE, MMMM d')}
                {' · '}
                {formatInZone(state.nextStream.startTime, state.nextStream.timezone, 'HH:mm')}
                {state.nextStream.endTime &&
                  ` — ${formatInZone(state.nextStream.endTime, state.nextStream.timezone, 'HH:mm')}`}
              </p>
              {state.nextStream.description && (
                <p className="mt-3 max-w-content text-sm text-muted">{state.nextStream.description}</p>
              )}
              <div className="mt-4">
                <Countdown target={state.nextStream.startTime.toISOString()} />
              </div>
            </div>
          ) : (
            <EmptyState>No upcoming streams scheduled yet.</EmptyState>
          )}
        </section>
      )}

      <section className="mb-16" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="mb-4 font-mono text-xs uppercase tracking-wide text-faint">
          Upcoming
        </h2>
        {upcoming.length > 1 ? (
          <div className="flex flex-col gap-3">
            {upcoming.slice(1, 6).map((s) => (
              <StreamCard
                key={s.id}
                slug={s.slug}
                title={s.title}
                description={s.description}
                startTime={s.startTime}
                timezone={s.timezone}
                status={s.status}
              />
            ))}
          </div>
        ) : (
          <EmptyState>Nothing else on the schedule yet.</EmptyState>
        )}
      </section>

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-4 font-mono text-xs uppercase tracking-wide text-faint">
          Recent streams
        </h2>
        {past.length > 0 ? (
          <div className="flex flex-col gap-3">
            {past.slice(0, 6).map((s) => (
              <StreamCard
                key={s.id}
                slug={s.slug}
                title={s.title}
                description={s.description}
                startTime={s.startTime}
                timezone={s.timezone}
                status={s.status}
              />
            ))}
          </div>
        ) : (
          <EmptyState>No streams recorded yet.</EmptyState>
        )}
      </section>
    </div>
  );
}
