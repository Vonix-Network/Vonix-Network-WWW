import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userEngagement } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Get top users by engagement score
    const leaderboard = await db
      .select({
        userId: userEngagement.userId,
        username: users.username,
        minecraftUsername: users.minecraftUsername,
        avatar: users.avatar,
        donationRankId: users.donationRankId,
        totalPoints: userEngagement.totalPoints,
        postsCreated: userEngagement.postsCreated,
        commentsCreated: userEngagement.commentsCreated,
        forumPostsCreated: userEngagement.forumPostsCreated,
        forumRepliesCreated: userEngagement.forumRepliesCreated,
        upvotesReceived: userEngagement.upvotesReceived,
        downvotesReceived: userEngagement.downvotesReceived,
        likesReceived: userEngagement.likesReceived,
      })
      .from(userEngagement)
      .leftJoin(users, eq(userEngagement.userId, users.id))
      .orderBy(desc(userEngagement.totalPoints))
      .limit(limit);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
