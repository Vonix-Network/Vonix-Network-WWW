import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, forumPosts, forumCategories } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = decodeURIComponent(params.username);
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // First get the user
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(forumPosts)
      .where(eq(forumPosts.authorId, user.id));

    const total = totalResult?.count || 0;

    // Get paginated forum posts
    const posts = await db
      .select({
        id: forumPosts.id,
        title: forumPosts.title,
        content: forumPosts.content,
        createdAt: forumPosts.createdAt,
        views: forumPosts.views,
        category: {
          name: forumCategories.name,
          slug: forumCategories.slug,
        },
      })
      .from(forumPosts)
      .innerJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
      .where(eq(forumPosts.authorId, user.id))
      .orderBy(desc(forumPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching user forum posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
