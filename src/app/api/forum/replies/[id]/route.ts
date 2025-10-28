import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { forumReplies, forumPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
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
    const replyId = parseInt(resolvedParams.id);
    if (isNaN(replyId)) {
      return NextResponse.json(
        { error: 'Invalid reply ID' },
        { status: 400 }
      );
    }

    // Get the reply to check ownership and get post ID
    const [reply] = await db
      .select({
        id: forumReplies.id,
        authorId: forumReplies.authorId,
        postId: forumReplies.postId,
      })
      .from(forumReplies)
      .where(eq(forumReplies.id, replyId))
      .limit(1);

    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }

    // Check if user can delete (author or moderator/admin)
    const canDelete = 
      reply.authorId === parseInt(session.user.id) ||
      session.user.role === 'admin' ||
      session.user.role === 'moderator';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Delete the reply
    await db
      .delete(forumReplies)
      .where(eq(forumReplies.id, replyId));

    // Update post reply count
    const [replyCount] = await db
      .select({ count: forumReplies.id })
      .from(forumReplies)
      .where(eq(forumReplies.postId, reply.postId));

    await db
      .update(forumPosts)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(forumPosts.id, reply.postId));

    return NextResponse.json({
      success: true,
      message: 'Reply deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting forum reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const replyId = parseInt(resolvedParams.id);
    if (isNaN(replyId)) {
      return NextResponse.json(
        { error: 'Invalid reply ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.length > 10000) {
      return NextResponse.json(
        { error: 'Invalid content' },
        { status: 400 }
      );
    }

    // Get the reply to check ownership
    const [reply] = await db
      .select({
        id: forumReplies.id,
        authorId: forumReplies.authorId,
      })
      .from(forumReplies)
      .where(eq(forumReplies.id, replyId))
      .limit(1);

    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }

    // Check if user can edit (only author can edit replies)
    if (reply.authorId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Update the reply
    await db
      .update(forumReplies)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(forumReplies.id, replyId));

    return NextResponse.json({
      success: true,
      message: 'Reply updated successfully',
    });

  } catch (error) {
    console.error('Error updating forum reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
