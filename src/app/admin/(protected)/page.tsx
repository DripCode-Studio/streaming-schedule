import Link from 'next/link';
import { db } from '@/lib/db';
import { twitchService } from '@/lib/twitch/service';
import { pickNextStream } from '@/lib/streams';
import { formatInZone } from '@/lib/time';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const now = new Date();

  const [total, upcomingCount, completedStreams, twitchStatus] = await Promise.all([
    db.stream.count(),
    db.stream.count({ where: { startTime: { gt: now }, status: { in: ['SCHEDULED', 'LIVE'] } } }),
    db.stream.findMany({
      where: { status: 'COMPLETED', endTime: { not: null } },
      select: { startTime: true, endTime: true },
    }),
    twitchService.getLiveStatus(),
  ]);

  const streamingMinutes = completedStreams.reduce(
    (sum: number, s: { startTime: Date; endTime: Date | null }) => {
      if (!s.endTime) return sum;
      return sum + (s.endTime.getTime() - s.startTime.getTime()) / 60_000;
    },
    0
  );
  const streamingHours = Math.round(streamingMinutes / 60);

  const allActive = await db.stream.findMany({
    where: { status: { not: 'DRAFT' } },
    select: { id: true, title: true, slug: true, status: true, startTime: true, endTime: true, timezone: true },
  });
  const nextStream = pickNextStream(allActive, now);

  return (
    <div>
      <h1 className="mb-8 text-xl font-semibold text-ink">Streaming dashboard</h1>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total streams" value={total} />
        <Stat label="Upcoming" value={upcomingCount} />
        <Stat label="Streaming hours" value={streamingHours} />
        <Stat label="Current status" value={twitchStatus.isLive ? 'LIVE' : 'OFFLINE'} accent={twitchStatus.isLive} />
      </div>

      <div className="mb-10">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wide text-faint">Next stream</h2>
        {nextStream ? (
          <Link
            href={`/admin/streams/${nextStream.id}`}
            className="block rounded border border-border px-5 py-4 hover:border-accent"
          >
            <p className="text-sm font-medium text-ink">{nextStream.title}</p>
            <p className="mt-1 font-mono text-xs text-muted">
              {formatInZone(nextStream.startTime, nextStream.timezone, 'EEE, MMM d · HH:mm')}
            </p>
          </Link>
        ) : (
          <p className="text-sm text-faint">Nothing scheduled.</p>
        )}
      </div>

      <Link
        href="/admin/streams/new"
        className="inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
      >
        + New stream
      </Link>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded border border-border px-4 py-3">
      <p className="font-mono text-xs uppercase tracking-wide text-faint">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent ? 'text-accent' : 'text-ink'}`}>{value}</p>
    </div>
  );
}
