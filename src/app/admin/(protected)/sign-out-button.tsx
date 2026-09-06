'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/admin/login' })}
      className="font-mono text-xs text-muted hover:text-accent"
    >
      Sign out
    </button>
  );
}
