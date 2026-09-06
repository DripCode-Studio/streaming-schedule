import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { twitchService } from '@/lib/twitch/service';
import { formatInZone, relativeLabel } from '@/lib/time';
import { StatusBadge } from '@/components/StatusBadge';
import { TwitchPlayer } from '@/components/TwitchPlayer';
import { siteConfig } from '@/lib/config';

interface Props {
  params: { slug: string };
}

async function getStream(slug: string) {
  return db.stream.findUnique({
    where: { slug },
    include: { series: true, project: true, tags: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stream = await getStream(params.slug);
  if (!stream) return {};

  const description = stream.description?.slice(0, 160) ?? siteConfig.siteDescription;

  return {
    title: stream.title,
    description,
    openGraph: { title: stream.title, description, type: 'article' },
    twitter: { card: 'summary_large_image', title: stream.title, description },
    alternates: { canonical: `/streams/${stream.slug}` },
  };
}

export default async function StreamDetailPage({ params }: Props) {
  const stream = await getStream(params.slug);
  if (!stream) notFound();

  const twitchStatus = await twitchService.getLiveStatus();
  const isThisStreamLive = twitchStatus.isLive && stream.status === 'LIVE';

  return (
    <div className="mx-auto max-w-content px-6 py-16">
      <Link href="/" className="mb-8 inline-block font-mono text-xs text-muted hover:text-accent">
        ← Back to schedule
      </Link>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">{stream.title}</h1>
        <StatusBadge status={stream.status} />
      </div>

      {(stream.series || stream.episodeNumber) && (
        <p className="mt-2 text-sm text-muted">
          {stream.series?.name}
          {stream.series && stream.episodeNumber && ' · '}
          {stream.episodeNumber && `Episode #${stream.episodeNumber}`}
        </p>
      )}

      <p className="mt-4 font-mono text-xs text-muted">
        {formatInZone(stream.startTime, stream.timezone, 'EEEE, MMMM d, yyyy')} ·{' '}
        {formatInZone(stream.startTime, stream.timezone, 'HH:mm')}
        {stream.endTime && ` — ${formatInZone(stream.endTime, stream.timezone, 'HH:mm')}`}
        {' · '}
        {relativeLabel(stream.startTime)}
      </p>

      {isThisStreamLive && (
        <div className="mt-8">
          <TwitchPlayer channel={siteConfig.twitchUsername} />
        </div>
      )}

      {stream.status === 'CANCELLED' && (
        <p className="mt-8 rounded border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          This stream was cancelled.
        </p>
      )}

      {stream.status === 'COMPLETED' && (stream.twitchVodUrl || stream.youtubeUrl) && (
        <div className="mt-8 flex flex-wrap gap-4">
          {stream.twitchVodUrl && (
            <a
              href={stream.twitchVodUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-sm text-accent hover:underline"
            >
              Watch VOD on Twitch →
            </a>
          )}
          {stream.youtubeUrl && (
            <a
              href={stream.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-sm text-accent hover:underline"
            >
              Watch on YouTube →
            </a>
          )}
        </div>
      )}

      {stream.description && (
        <section className="mt-10">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-faint">Description</h2>
          <p className="max-w-content whitespace-pre-line text-sm text-muted">{stream.description}</p>
        </section>
      )}

      {stream.tags.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-faint">Technologies</h2>
          <p className="font-mono text-sm text-muted">
            {stream.tags.map((t: (typeof stream.tags)[number]) => t.name).join(' · ')}
          </p>
        </section>
      )}

      {stream.project && (
        <section className="mt-10">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-faint">Project</h2>
          <p className="text-sm text-ink">{stream.project.name}</p>
        </section>
      )}

      {(stream.githubRepository || stream.githubPullRequest || stream.githubCommit) && (
        <section className="mt-10">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-faint">Resources</h2>
          <ul className="flex flex-col gap-1 font-mono text-sm text-accent">
            {stream.githubRepository && (
              <li><a href={stream.githubRepository} target="_blank" rel="noreferrer" className="hover:underline">Repository →</a></li>
            )}
            {stream.githubPullRequest && (
              <li><a href={stream.githubPullRequest} target="_blank" rel="noreferrer" className="hover:underline">Pull request →</a></li>
            )}
            {stream.githubCommit && (
              <li><a href={stream.githubCommit} target="_blank" rel="noreferrer" className="hover:underline">Commit →</a></li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
