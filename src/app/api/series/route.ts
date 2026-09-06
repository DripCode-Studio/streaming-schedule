import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdminSession } from '@/lib/require-admin';
import { uniqueSlug } from '@/lib/slug';
import { z } from 'zod';

const seriesInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('ACTIVE'),
  coverUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export async function GET() {
  const series = await db.series.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(series);
}

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = seriesInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = await uniqueSlug(
    parsed.data.name,
    async (candidate) => (await db.series.count({ where: { slug: candidate } })) > 0
  );

  const series = await db.series.create({
    data: { ...parsed.data, coverUrl: parsed.data.coverUrl || null, slug },
  });

  return NextResponse.json(series, { status: 201 });
}
