import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { forumCategories, forumPosts, forumReplies, users } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    noStore();

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Get category
    const [category] = await db
      .select()
      .from(forumCategories)
      .where(eq(forumCategories.id, categoryId));

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Get posts in this category
    const posts = await db
      .select({
        id: forumPosts.id,
        title: forumPosts.title,
        content: forumPosts.content,
        pinned: forumPosts.pinned,
        locked: forumPosts.locked,
        views: forumPosts.views,
        createdAt: forumPosts.createdAt,
        author: {
          username: users.username,
        },
        replyCount: sql<number>`count(${forumReplies.id})`.as('reply_count'),
      })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.authorId, users.id))
      .leftJoin(forumReplies, eq(forumPosts.id, forumReplies.postId))
      .where(eq(forumPosts.categoryId, category.id))
      .groupBy(forumPosts.id, users.id)
      .orderBy(desc(forumPosts.pinned), desc(forumPosts.createdAt))
      .limit(50);

    // Convert timestamps to Date objects with null check
    const topics = posts.map((post) => ({
      ...post,
      createdAt: post.createdAt 
        ? (post.createdAt instanceof Date 
            ? post.createdAt 
            : new Date(typeof post.createdAt === 'number' ? post.createdAt * 1000 : post.createdAt))
        : new Date(),
    }));

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

