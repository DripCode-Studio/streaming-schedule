import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient instance across hot reloads in dev so we don't
// exhaust the database connection pool (especially important on free-tier DBs).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
