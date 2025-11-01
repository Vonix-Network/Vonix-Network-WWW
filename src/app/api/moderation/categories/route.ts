import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { forumCategories } from '@/db/schema';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  icon: z.string().max(10).optional().nullable(),
  orderIndex: z.number().int().min(0).default(0),
});

// POST /api/moderation/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const role = (session?.user as any)?.role;

    if (!session || (role !== 'admin' && role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const data = categorySchema.parse(body);

    const [category] = await db
      .insert(forumCategories)
      .values({
        name: data.name,
        description: data.description || null,
        slug: data.slug,
        icon: data.icon || '📁',
        orderIndex: data.orderIndex,
      })
      .returning();

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to create category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
