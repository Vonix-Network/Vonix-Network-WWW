import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { forumCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  icon: z.string().max(10).optional().nullable(),
  orderIndex: z.number().int().min(0).default(0),
});

// PATCH /api/moderation/categories/[id] - Update category
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const role = (session?.user as any)?.role;

    if (!session || (role !== 'admin' && role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const data = categorySchema.parse(body);

    const [category] = await db
      .update(forumCategories)
      .set({
        name: data.name,
        description: data.description || null,
        slug: data.slug,
        icon: data.icon || '📁',
        orderIndex: data.orderIndex,
      })
      .where(eq(forumCategories.id, categoryId))
      .returning();

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to update category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/moderation/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const role = (session?.user as any)?.role;

    if (!session || (role !== 'admin' && role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [category] = await db
      .delete(forumCategories)
      .where(eq(forumCategories.id, categoryId))
      .returning();

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
