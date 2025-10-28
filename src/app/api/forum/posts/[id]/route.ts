import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { forumPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = parseInt(resolvedParams.id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const [post] = await db
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.id, postId));

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const postId = parseInt(resolvedParams.id);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const postId = parseInt(resolvedParams.id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const body = await request.json();
    const { pinned, locked, title, content } = body;

    // Get the post to check ownership
    const [post] = await db
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.id, postId));

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const canModerate = 
      session.user.role === 'moderator' ||
      session.user.role === 'admin';
    
    const isAuthor = post.authorId === parseInt(session.user.id);

    // Build update data based on permissions
    const updateData: any = {};

    // Authors and moderators can edit content
    if ((title !== undefined || content !== undefined) && (isAuthor || canModerate)) {
      if (title !== undefined) {
        if (!title.trim()) {
          return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
        }
        updateData.title = title.trim();
      }
      if (content !== undefined) {
        if (!content.trim()) {
          return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
        }
        updateData.content = content.trim();
      }
    }

    // Only moderators and admins can pin/lock
    if ((pinned !== undefined || locked !== undefined) && !canModerate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (pinned !== undefined) updateData.pinned = pinned;
    if (locked !== undefined) updateData.locked = locked;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

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
