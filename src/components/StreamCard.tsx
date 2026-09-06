import Link from 'next/link';
import { formatInZone, relativeLabel } from '@/lib/time';
import { StatusBadge } from './StatusBadge';

interface StreamCardProps {
  slug: string;
  title: string;
  description?: string | null;
  startTime: Date;
  timezone: string;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  emphasized?: boolean;
}

export function StreamCard({
  slug,
  title,
  description,
  startTime,
  timezone,
  status,
  emphasized = false,
}: StreamCardProps) {
  const isPast = status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED';

  return (
    <Link
      href={`/streams/${slug}`}
      className={[
        'block rounded border px-6 py-5 transition-colors',
        emphasized
          ? 'border-border-strong bg-panel hover:border-accent'
          : 'border-border hover:border-border-strong',
        isPast || isCancelled ? 'opacity-70' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className={`font-medium ${emphasized ? 'text-lg' : 'text-base'} text-ink`}>{title}</h3>
        <StatusBadge status={status} />
      </div>

      <p className="mt-1 font-mono text-xs text-muted">
        {relativeLabel(startTime)} · {formatInZone(startTime, timezone, 'EEE, MMM d · HH:mm')}
      </p>

      {description && <p className="mt-3 max-w-content text-sm text-muted">{description}</p>}
    </Link>
  );
}
