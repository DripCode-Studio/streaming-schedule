import { formatInZone, relativeLabel } from '@/lib/time';
import { StatusBadge } from './StatusBadge';
import { siteConfig } from '@/lib/config';

interface StreamCardProps {
  title: string;
  description?: string | null;
  startTime: Date;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  /** Overrides the auto "starts in / finished" text. */
  label?: string;
  /** Grayed-out, "disabled" look for past streams. */
  dim?: boolean;
  emphasized?: boolean;
}

export function StreamCard({
  title,
  description,
  startTime,
  status,
  label,
  dim = false,
  emphasized = false,
}: StreamCardProps) {
  const isCancelled = status === 'CANCELLED';

  const styles = dim
    ? 'border-border bg-transparent opacity-60'
    : emphasized
      ? 'border-border-strong bg-panel hover:border-accent'
      : ['border-border', isCancelled ? 'opacity-70' : ''].join(' ');

  return (
    <div className={`block rounded border px-6 py-5 transition-colors ${styles}`}>
      <div className="flex items-center justify-between gap-4">
        <h3 className={`font-medium ${emphasized && !dim ? 'text-lg' : 'text-base'} ${dim ? 'text-faint' : 'text-ink'}`}>
          {title}
        </h3>
        {!dim && <StatusBadge status={status} />}
      </div>

      <p className={`mt-1 font-mono text-xs ${dim ? 'text-faint' : 'text-muted'}`}>
        {(label ?? relativeLabel(startTime))} · {formatInZone(startTime, siteConfig.displayTimezone, 'EEE, MMM d · HH:mm')}
      </p>

      {description && (
        <p className={`mt-3 max-w-content text-sm ${dim ? 'text-faint' : 'text-muted'}`}>{description}</p>
      )}
    </div>
  );
}