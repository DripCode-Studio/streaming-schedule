import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdminSession } from '@/lib/require-admin';
import { streamInputSchema } from '@/lib/validation';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const stream = await db.stream.findUnique({
    where: { id: params.id },
    include: { series: true, project: true, tags: true },
  });
  if (!stream) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(stream);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = streamInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tagIds, ...data } = parsed.data;

  const existing = await db.stream.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const stream = await db.stream.update({
    where: { id: params.id },
    data: {
      ...data,
      thumbnailUrl: data.thumbnailUrl === '' ? null : data.thumbnailUrl,
      twitchUrl: data.twitchUrl === '' ? null : data.twitchUrl,
      twitchVodUrl: data.twitchVodUrl === '' ? null : data.twitchVodUrl,
      youtubeUrl: data.youtubeUrl === '' ? null : data.youtubeUrl,
      tags: tagIds ? { set: tagIds.map((id) => ({ id })) } : undefined,
    },
    include: { series: true, project: true, tags: true },
  });

  return NextResponse.json(stream);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await db.stream.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.stream.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
