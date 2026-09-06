import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/** Returns the session if the request is from a logged-in admin, otherwise null. */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}
