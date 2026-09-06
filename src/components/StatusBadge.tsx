type Status = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

const STYLES: Record<Status, { label: string; className: string; dot: string }> = {
  LIVE: { label: 'Live now', className: 'text-accent', dot: 'bg-accent' },
  SCHEDULED: { label: 'Scheduled', className: 'text-accent', dot: 'bg-accent' },
  COMPLETED: { label: 'Completed', className: 'text-muted', dot: 'bg-faint' },
  CANCELLED: { label: 'Cancelled', className: 'text-danger', dot: 'bg-danger' },
  DRAFT: { label: 'Draft', className: 'text-faint', dot: 'bg-faint' },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide ${s.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  );
}
