import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdminSession } from '@/lib/require-admin';
import { uniqueSlug } from '@/lib/slug';
import { z } from 'zod';

const projectInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['IDEA', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
  repositoryUrl: z.string().url().optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export async function GET() {
  const projects = await db.project.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = projectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = await uniqueSlug(
    parsed.data.name,
    async (candidate) => (await db.project.count({ where: { slug: candidate } })) > 0
  );

  const project = await db.project.create({
    data: {
      ...parsed.data,
      repositoryUrl: parsed.data.repositoryUrl || null,
      websiteUrl: parsed.data.websiteUrl || null,
      slug,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
