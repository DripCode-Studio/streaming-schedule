import { db } from '@/lib/db';
import { twitchService } from '@/lib/twitch/service';
import { resolveHomepageState, sortPast, sortUpcoming } from '@/lib/streams';
import { siteConfig, twitchChannelUrl } from '@/lib/config';
import { TwitchPlayer } from '@/components/TwitchPlayer';
import { StreamCard } from '@/components/StreamCard';
import { EmptyState } from '@/components/EmptyState';
import { Countdown } from '@/components/Countdown';
import { elapsedLabel, formatInZone, relativeLabel } from '@/lib/time';

export const revalidate = 30; // keep live state reasonably fresh without hitting Twitch on every request

const PAST_COUNT = 3;
const UPCOMING_COUNT = 10;

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

  const isLive = state.kind === 'live';
  const currentStream = isLive ? (state.kind === 'live' ? state.stream : null) : null;
  const nextStreamCard = !isLive && state.kind === 'offline' ? state.nextStream : null;

  const past = sortPast(streams, now)
    .filter((s) => s.id !== currentStream?.id)
    .slice(0, PAST_COUNT);

  const upcoming = sortUpcoming(streams, now)
    .filter((s) => s.id !== nextStreamCard?.id)
    .slice(0, UPCOMING_COUNT);

  const empty = past.length === 0 && upcoming.length === 0 && !isLive && !nextStreamCard;

  return (
    <div className="mx-auto max-w-content px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Schedule</h1>
        <p className="mt-2 text-sm text-muted">
          for{' '}
          <a href={twitchChannelUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            twitch.tv/{siteConfig.twitchUsername}
          </a>{' '}
          streams
        </p>
      </header>

      {empty ? (
        <EmptyState>No streams recorded yet.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {past.map((s) => (
            <StreamCard
              key={s.id}
              title={s.title}
              description={s.description}
              startTime={s.startTime}
              timezone={s.timezone}
              status={s.status}
              dim
              label={`Streamed ${relativeLabel(s.startTime, now).replace(/^finished /, '')}`}
            />
          ))}

          {isLive && state.kind === 'live' ? (
            <section className="rounded border border-border-strong bg-panel px-4 py-4">
              <TwitchPlayer channel={siteConfig.twitchUsername} />
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 pb-1">
                <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-accent">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
                  Currently streaming
                </span>
                <p className="text-sm font-medium text-ink">{state.stream?.title ?? state.twitch.title}</p>
                <p className="font-mono text-xs text-muted">
                  started {elapsedLabel(new Date(state.twitch.startedAt), now)} ago
                </p>
                <a
                  href={twitchChannelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-accent hover:underline"
                >
                  Watch on Twitch →
                </a>
              </div>
            </section>
          ) : nextStreamCard ? (
            <section className="rounded border border-border-strong bg-panel px-6 py-5">
              <p className="font-mono text-xs uppercase tracking-wide text-accent">Next stream</p>
              <h3 className="mt-1 text-lg font-medium text-ink">{nextStreamCard.title}</h3>
              <p className="mt-1 text-sm text-muted">
                Will start in{' '}
                {relativeLabel(nextStreamCard.startTime, now).replace(/^starts in /, '')} ·{' '}
                {formatInZone(nextStreamCard.startTime, nextStreamCard.timezone, 'EEEE, MMM d · HH:mm')}
              </p>
              {nextStreamCard.description && (
                <p className="mt-3 max-w-content text-sm text-muted">{nextStreamCard.description}</p>
              )}
              <div className="mt-3">
                <Countdown target={nextStreamCard.startTime.toISOString()} />
              </div>
            </section>
          ) : null}

          {upcoming.map((s) => (
            <StreamCard
              key={s.id}
              title={s.title}
              description={s.description}
              startTime={s.startTime}
              timezone={s.timezone}
              status={s.status}
              label={`Will start in ${relativeLabel(s.startTime, now).replace(/^starts in /, '')}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}