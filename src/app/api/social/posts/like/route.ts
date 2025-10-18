import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { socialLikes } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

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

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
