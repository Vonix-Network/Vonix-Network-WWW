import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, socialPosts, socialComments, forumPosts, forumReplies } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const resolvedParams = await params;
    const username = decodeURIComponent(resolvedParams.username);

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

    // Get user statistics
    const [stats] = await db
      .select({
        socialPostsCount: sql<number>`count(distinct ${socialPosts.id})`.as('socialPostsCount'),
        socialCommentsCount: sql<number>`count(distinct ${socialComments.id})`.as('socialCommentsCount'),
        forumPostsCount: sql<number>`count(distinct ${forumPosts.id})`.as('forumPostsCount'),
        forumRepliesCount: sql<number>`count(distinct ${forumReplies.id})`.as('forumRepliesCount'),
      })
      .from(users)
      .leftJoin(socialPosts, eq(socialPosts.userId, users.id))
      .leftJoin(socialComments, eq(socialComments.userId, users.id))
      .leftJoin(forumPosts, eq(forumPosts.authorId, users.id))
      .leftJoin(forumReplies, eq(forumReplies.authorId, users.id))
      .where(eq(users.id, user.id));

    return NextResponse.json({
      stats: {
        socialPostsCount: stats?.socialPostsCount || 0,
        socialCommentsCount: stats?.socialCommentsCount || 0,
        forumPostsCount: stats?.forumPostsCount || 0,
        forumRepliesCount: stats?.forumRepliesCount || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
