import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignOutButton } from './sign-out-button';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/admin/login');

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
