import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, socialPosts, socialComments } from '@/db/schema';
import { eq, desc, sql, count } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const resolvedParams = await params;
    const username = decodeURIComponent(resolvedParams.username);
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
      .from(socialPosts)
      .where(eq(socialPosts.userId, user.id));

    const total = totalResult?.count || 0;

    // Get paginated social posts with stats
    const posts = await db
      .select({
        id: socialPosts.id,
        content: socialPosts.content,
        imageUrl: socialPosts.imageUrl,
        createdAt: socialPosts.createdAt,
        likesCount: sql<number>`count(distinct social_likes.id)`.as('likesCount'),
        commentsCount: sql<number>`count(distinct ${socialComments.id})`.as('commentsCount'),
      })
      .from(socialPosts)
      .leftJoin(sql`social_likes`, sql`social_likes.post_id = ${socialPosts.id}`)
      .leftJoin(socialComments, eq(socialComments.postId, socialPosts.id))
      .where(eq(socialPosts.userId, user.id))
      .groupBy(socialPosts.id)
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      posts: posts.map(post => ({
        ...post,
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching user social posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
