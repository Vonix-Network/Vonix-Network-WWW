import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { groupPosts, groupPostLikes, groupMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/groups/[id]/posts/[postId]/like - Toggle like on a group post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);
    const postId = parseInt(resolvedParams.postId);
    const userId = Number(session.user.id);

    if (isNaN(groupId) || isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Check if user is a member
    const membership = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        )
      )
      .get();

    if (!membership) {
      return NextResponse.json({ error: 'You must be a member to like posts' }, { status: 403 });
    }

    // Check if post exists
    const post = await db
      .select()
      .from(groupPosts)
      .where(eq(groupPosts.id, postId))
      .get();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await db
      .select()
      .from(groupPostLikes)
      .where(
        and(
          eq(groupPostLikes.postId, postId),
          eq(groupPostLikes.userId, userId)
        )
      )
      .get();

    if (existingLike) {
      // Unlike
      await db
        .delete(groupPostLikes)
        .where(eq(groupPostLikes.id, existingLike.id));

      // Decrement count
      await db
        .update(groupPosts)
        .set({ likesCount: Math.max(0, post.likesCount - 1) })
        .where(eq(groupPosts.id, postId));

      return NextResponse.json({ 
        liked: false, 
        likesCount: Math.max(0, post.likesCount - 1) 
      });
    } else {
      // Like
      await db
        .insert(groupPostLikes)
        .values({
          postId,
          userId,
        });

      // Increment count
      await db
        .update(groupPosts)
        .set({ likesCount: post.likesCount + 1 })
        .where(eq(groupPosts.id, postId));

      return NextResponse.json({ 
        liked: true, 
        likesCount: post.likesCount + 1 
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
