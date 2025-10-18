import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { forumPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Get the post to check ownership
    const [post] = await db
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.id, postId));

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check permissions: author, moderator, or admin can delete
    const canDelete = 
      post.authorId === parseInt(session.user.id) ||
      session.user.role === 'moderator' ||
      session.user.role === 'admin';

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the post (cascade will handle replies)
    await db.delete(forumPosts).where(eq(forumPosts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const body = await request.json();
    const { pinned, locked } = body;

    // Get the post to check ownership
    const [post] = await db
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.id, postId));

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Only moderators and admins can pin/lock
    const canModerate = 
      session.user.role === 'moderator' ||
      session.user.role === 'admin';

    if (!canModerate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the post
    const updateData: any = {};
    if (pinned !== undefined) updateData.pinned = pinned;
    if (locked !== undefined) updateData.locked = locked;

    await db
      .update(forumPosts)
      .set(updateData)
      .where(eq(forumPosts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
