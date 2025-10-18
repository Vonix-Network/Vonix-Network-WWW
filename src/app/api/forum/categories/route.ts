import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { forumCategories } from '@/db/schema';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const categories = await db
      .select({
        id: forumCategories.id,
        name: forumCategories.name,
        slug: forumCategories.slug,
      })
      .from(forumCategories)
      .orderBy(forumCategories.orderIndex);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  slug: z.string().min(1).max(100),
  icon: z.string().optional(),
  orderIndex: z.number().default(0),
  createPermission: z.enum(['user', 'moderator', 'admin']).default('user'),
  replyPermission: z.enum(['user', 'moderator', 'admin']).default('user'),
  viewPermission: z.enum(['user', 'moderator', 'admin']).default('user'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or moderator
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Create the category
    const [newCategory] = await db
      .insert(forumCategories)
      .values({
        name: data.name,
        description: data.description || null,
        slug: data.slug,
        icon: data.icon || null,
        orderIndex: data.orderIndex,
        createPermission: data.createPermission,
        replyPermission: data.replyPermission,
        viewPermission: data.viewPermission,
      })
      .returning();

    return NextResponse.json({
      success: true,
      category: newCategory,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
