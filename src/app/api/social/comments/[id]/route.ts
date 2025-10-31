import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { socialComments, socialCommentLikes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
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

    // Get the comment to check ownership
    const [comment] = await db
      .select({
        id: socialComments.id,
        userId: socialComments.userId,
        postId: socialComments.postId,
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

    // Check if user can delete (author or moderator/admin)
    const canDelete = 
      comment.userId === parseInt(session.user.id) ||
      session.user.role === 'admin' ||
      session.user.role === 'moderator';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Delete comment likes first (foreign key constraint)
    await db
      .delete(socialCommentLikes)
      .where(eq(socialCommentLikes.commentId, commentId));

    // Delete child comments (replies)
    await db
      .delete(socialComments)
      .where(eq(socialComments.parentCommentId, commentId));

    // Delete the comment
    await db
      .delete(socialComments)
      .where(eq(socialComments.id, commentId));

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting social comment:', error);
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
    const session = await auth();
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

    const body = await request.json();
    const { content } = body;

    if (!content || content.length > 2000) {
      return NextResponse.json(
        { error: 'Invalid content' },
        { status: 400 }
      );
    }

    // Get the comment to check ownership
    const [comment] = await db
      .select({
        id: socialComments.id,
        userId: socialComments.userId,
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

    // Check if user can edit (only author can edit comments)
    if (comment.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Update the comment
    await db
      .update(socialComments)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(socialComments.id, commentId));

    return NextResponse.json({
      success: true,
      message: 'Comment updated successfully',
    });

  } catch (error) {
    console.error('Error updating social comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
