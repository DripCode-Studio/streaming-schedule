import Link from 'next/link';
import { SignOutButton } from './sign-out-button';

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-content px-6 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
        <nav className="flex gap-5 font-mono text-xs text-muted">
          <Link href="/admin" className="hover:text-accent">Dashboard</Link>
          <Link href="/admin/streams" className="hover:text-accent">Streams</Link>
        </nav>
        <SignOutButton />
      </div>
      {children}
    </div>
  );
}
