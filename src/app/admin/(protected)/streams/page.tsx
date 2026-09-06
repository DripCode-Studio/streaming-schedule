import Link from 'next/link';
import { db } from '@/lib/db';
import { formatInZone } from '@/lib/time';
import { StatusBadge } from '@/components/StatusBadge';
import { StreamRowActions } from './stream-row-actions';

export const dynamic = 'force-dynamic';

export default async function AdminStreamsPage() {
  const streams = await db.stream.findMany({
    orderBy: { startTime: 'desc' },
    take: 100,
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Streams</h1>
        <Link
          href="/admin/streams/new"
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
        >
          + New stream
        </Link>
      </div>

      {streams.length === 0 ? (
        <p className="text-sm text-faint">No streams yet. Create your first one.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {streams.map((s: (typeof streams)[number]) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-4 rounded border border-border px-5 py-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="truncate text-sm font-medium text-ink">{s.title}</p>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  {formatInZone(s.startTime, s.timezone, 'EEE, MMM d, yyyy · HH:mm')}
                </p>
              </div>
              <StreamRowActions streamId={s.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
