import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdminSession } from '@/lib/require-admin';
import { streamInputSchema } from '@/lib/validation';
import { uniqueSlug } from '@/lib/slug';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const status = params.get('status') ?? undefined;
  const series = params.get('series') ?? undefined;
  const project = params.get('project') ?? undefined;
  const tag = params.get('tag') ?? undefined;
  const year = params.get('year') ?? undefined;
  const search = params.get('search') ?? undefined;
  const page = Math.max(1, Number(params.get('page') ?? '1'));
  const size = Math.min(100, Math.max(1, Number(params.get('size') ?? '20')));

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (series) where.series = { slug: series };
  if (project) where.project = { slug: project };
  if (tag) where.tags = { some: { slug: tag } };
  if (year) {
    where.startTime = {
      gte: new Date(`${year}-01-01T00:00:00.000Z`),
      lt: new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`),
    };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    db.stream.findMany({
      where,
      orderBy: { startTime: 'desc' },
      skip: (page - 1) * size,
      take: size,
      include: { series: true, project: true, tags: true },
    }),
    db.stream.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, size });
}

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = streamInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tagIds, ...data } = parsed.data;

  const slug = await uniqueSlug(
    data.title,
    async (candidate) => (await db.stream.count({ where: { slug: candidate } })) > 0
  );

  const stream = await db.stream.create({
    data: {
      ...data,
      slug,
      thumbnailUrl: data.thumbnailUrl || null,
      twitchUrl: data.twitchUrl || null,
      twitchVodUrl: data.twitchVodUrl || null,
      youtubeUrl: data.youtubeUrl || null,
      tags: tagIds?.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
    },
    include: { series: true, project: true, tags: true },
  });

  return NextResponse.json(stream, { status: 201 });
}
