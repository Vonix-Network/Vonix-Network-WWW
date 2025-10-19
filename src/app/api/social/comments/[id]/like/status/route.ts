import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { socialCommentLikes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // If not logged in, return not liked
    if (!session?.user?.id) {
      return NextResponse.json({ isLiked: false });
    }

    const commentId = parseInt(params.id);
    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    // Check if user has liked this comment
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

    return NextResponse.json({
      isLiked: !!existingLike,
    });

  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
