import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-content px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-wide text-faint">404</p>
      <h1 className="mt-2 text-xl font-medium text-ink">This page doesn&apos;t exist.</h1>
      <Link href="/" className="mt-6 inline-block font-mono text-sm text-accent hover:underline">
        ← Back to schedule
      </Link>
    </div>
  );
}
