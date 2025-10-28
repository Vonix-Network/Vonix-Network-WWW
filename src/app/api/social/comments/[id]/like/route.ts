import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { socialComments, socialCommentLikes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { awardXP, XP_REWARDS } from '@/lib/xp-system';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const commentId = parseInt(resolvedParams.id);
    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    // Check if comment exists
    const [comment] = await db
      .select({
        id: socialComments.id,
        userId: socialComments.userId,
        likesCount: socialComments.likesCount,
      })
      .from(socialComments)
      .where(eq(socialComments.id, commentId))
      .limit(1);

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user already liked this comment
    const [existingLike] = await db
      .select()
      .from(socialCommentLikes)
      .where(
        and(
          eq(socialCommentLikes.commentId, commentId),
          eq(socialCommentLikes.userId, parseInt(session.user.id))
        )
      )
      .limit(1);

    let newLikesCount: number;
    let isLiked: boolean;

    if (existingLike) {
      // Unlike the comment
      await db
        .delete(socialCommentLikes)
        .where(
          and(
            eq(socialCommentLikes.commentId, commentId),
            eq(socialCommentLikes.userId, parseInt(session.user.id))
          )
        );

      newLikesCount = Math.max(0, comment.likesCount - 1);
      isLiked = false;
    } else {
      // Like the comment
      await db
        .insert(socialCommentLikes)
        .values({
          commentId: commentId,
          userId: parseInt(session.user.id),
          createdAt: new Date(),
        });

      newLikesCount = comment.likesCount + 1;
      isLiked = true;

      // Award XP to comment author (not the liker)
      const currentUserId = parseInt(session.user.id);
      if (comment.userId !== currentUserId) {
        try {
          await awardXP(
            comment.userId,
            XP_REWARDS.COMMENT_LIKE,
            'comment_like_received',
            commentId,
            'Received a like on your comment'
          );
        } catch (xpError) {
          console.error('Error awarding XP for comment like:', xpError);
        }
      }
    }

    // Update comment likes count
    await db
      .update(socialComments)
      .set({
        likesCount: newLikesCount,
        updatedAt: new Date(),
      })
      .where(eq(socialComments.id, commentId));

    return NextResponse.json({
      success: true,
      isLiked,
      likesCount: newLikesCount,
    });

  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
