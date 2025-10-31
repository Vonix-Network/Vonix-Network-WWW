import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { groupPostComments, groupPosts, groupMembers, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

/**
 * GET /api/groups/[id]/posts/[postId]/comments - Get comments for a post
 */
export async function GET(
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
      return NextResponse.json({ error: 'You must be a member to view comments' }, { status: 403 });
    }

    // Get comments with author info
    const comments = await db
      .select({
        id: groupPostComments.id,
        content: groupPostComments.content,
        likesCount: groupPostComments.likesCount,
        createdAt: groupPostComments.createdAt,
        author: {
          id: users.id,
          username: users.username,
          minecraftUsername: users.minecraftUsername,
          avatar: users.avatar,
          role: users.role,
          donationRankId: users.donationRankId,
        },
      })
      .from(groupPostComments)
      .innerJoin(users, eq(groupPostComments.userId, users.id))
      .where(eq(groupPostComments.postId, postId))
      .orderBy(desc(groupPostComments.createdAt));

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

/**
 * POST /api/groups/[id]/posts/[postId]/comments - Create a comment
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
      return NextResponse.json({ error: 'You must be a member to comment' }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // Create comment
    const newComment = await db
      .insert(groupPostComments)
      .values({
        postId,
        userId,
        content: validatedData.content,
      })
      .returning();

    // Increment comments count on post
    const post = await db
      .select()
      .from(groupPosts)
      .where(eq(groupPosts.id, postId))
      .get();

    if (post) {
      await db
        .update(groupPosts)
        .set({ commentsCount: post.commentsCount + 1 })
        .where(eq(groupPosts.id, postId));
    }

    // Get comment with author info
    const commentWithAuthor = await db
      .select({
        id: groupPostComments.id,
        content: groupPostComments.content,
        likesCount: groupPostComments.likesCount,
        createdAt: groupPostComments.createdAt,
        author: {
          id: users.id,
          username: users.username,
          minecraftUsername: users.minecraftUsername,
          avatar: users.avatar,
          role: users.role,
        },
      })
      .from(groupPostComments)
      .innerJoin(users, eq(groupPostComments.userId, users.id))
      .where(eq(groupPostComments.id, newComment[0].id))
      .get();

    return NextResponse.json(commentWithAuthor, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
