import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { groupPostComments, groupPosts, groupMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * DELETE /api/groups/[id]/posts/[postId]/comments/[commentId] - Delete a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);
    const postId = parseInt(resolvedParams.postId);
    const commentId = parseInt(resolvedParams.commentId);
    const userId = Number(session.user.id);

    if (isNaN(groupId) || isNaN(postId) || isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Get the comment
    const comment = await db
      .select()
      .from(groupPostComments)
      .where(eq(groupPostComments.id, commentId))
      .get();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check permissions
    const isAuthor = comment.userId === userId;
    const isSiteAdmin = session.user.role === 'admin' || session.user.role === 'moderator';
    
    // Check if user is group admin/moderator
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

    const isGroupModerator = membership && (membership.role === 'admin' || membership.role === 'moderator');
    const canDelete = isAuthor || isGroupModerator || isSiteAdmin;

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete comment
    await db
      .delete(groupPostComments)
      .where(eq(groupPostComments.id, commentId));

    // Decrement comments count on post
    const post = await db
      .select()
      .from(groupPosts)
      .where(eq(groupPosts.id, postId))
      .get();

    if (post) {
      await db
        .update(groupPosts)
        .set({ commentsCount: Math.max(0, post.commentsCount - 1) })
        .where(eq(groupPosts.id, postId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
