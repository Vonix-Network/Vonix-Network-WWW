import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { socialLikes, socialPosts } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { awardXP, XP_REWARDS } from '@/lib/xp-system';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Check if already liked
    const existingLike = await db.query.socialLikes.findFirst({
      where: and(
        eq(socialLikes.postId, postId),
        eq(socialLikes.userId, userId)
      ),
    });

    if (existingLike) {
      // Unlike
      await db
        .delete(socialLikes)
        .where(
          and(
            eq(socialLikes.postId, postId),
            eq(socialLikes.userId, userId)
          )
        );

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.insert(socialLikes).values({
        postId,
        userId,
      });

      // Award XP to the post author (not the liker)
      try {
        const [post] = await db
          .select({ userId: socialPosts.userId })
          .from(socialPosts)
          .where(eq(socialPosts.id, postId))
          .limit(1);

        if (post && post.userId !== userId) {
          // Don't award XP for liking your own post
          await awardXP(
            post.userId,
            XP_REWARDS.POST_LIKE,
            'post_like_received',
            postId,
            'Received a like on your post'
          );
        }
      } catch (xpError) {
        console.error('Error awarding XP for like:', xpError);
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
