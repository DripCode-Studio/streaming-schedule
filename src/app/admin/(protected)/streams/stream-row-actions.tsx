'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function StreamRowActions({ streamId }: { streamId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this stream? This cannot be undone.')) return;
    setDeleting(true);
    const res = await fetch(`/api/streams/${streamId}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert('Failed to delete stream.');
    }
  }

  return (
    <div className="flex flex-shrink-0 items-center gap-4 font-mono text-xs">
      <Link href={`/admin/streams/${streamId}`} className="text-muted hover:text-accent">
        Edit
      </Link>
      <Link href={`/admin/streams/new?duplicateFrom=${streamId}`} className="text-muted hover:text-accent">
        Duplicate
      </Link>
      <button onClick={handleDelete} disabled={deleting} className="text-muted hover:text-danger">
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  );
}
