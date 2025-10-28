import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { groupPosts, groupMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  imageUrl: z.string().url().optional().nullable(),
  pinned: z.boolean().optional(),
});

/**
 * GET /api/groups/[id]/posts/[postId] - Get a single post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const postId = parseInt(resolvedParams.postId);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const post = await db
      .select({
        id: groupPosts.id,
        groupId: groupPosts.groupId,
        content: groupPosts.content,
        imageUrl: groupPosts.imageUrl,
        likesCount: groupPosts.likesCount,
        commentsCount: groupPosts.commentsCount,
        pinned: groupPosts.pinned,
        createdAt: groupPosts.createdAt,
        updatedAt: groupPosts.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          minecraftUsername: users.minecraftUsername,
          avatar: users.avatar,
          role: users.role,
          level: users.level,
        },
      })
      .from(groupPosts)
      .innerJoin(users, eq(groupPosts.userId, users.id))
      .where(eq(groupPosts.id, postId))
      .get();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

/**
 * PATCH /api/groups/[id]/posts/[postId] - Update a post
 * Can be used by post author or group admin/moderator
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);
    const postId = parseInt(resolvedParams.postId);
    
    if (isNaN(groupId) || isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Get the post
    const post = await db
      .select()
      .from(groupPosts)
      .where(eq(groupPosts.id, postId))
      .get();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check permissions
    const isAuthor = post.userId === Number(session.user.id);
    const isSiteAdmin = session.user.role === 'admin' || session.user.role === 'moderator';
    
    // Check if user is group admin/moderator
    const membership = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, Number(session.user.id))
        )
      )
      .get();

    const isGroupModerator = membership && (membership.role === 'admin' || membership.role === 'moderator');
    const canEdit = isAuthor || isGroupModerator || isSiteAdmin;

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    // Only group moderators/admins can pin posts
    if (validatedData.pinned !== undefined && !isGroupModerator && !isSiteAdmin) {
      return NextResponse.json({ error: 'Only group moderators can pin posts' }, { status: 403 });
    }

    // Update the post
    const updates: any = {};
    if (validatedData.content !== undefined) updates.content = validatedData.content;
    if (validatedData.imageUrl !== undefined) updates.imageUrl = validatedData.imageUrl;
    if (validatedData.pinned !== undefined) updates.pinned = validatedData.pinned;

    await db
      .update(groupPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groupPosts.id, postId));

    // Get updated post with author
    const updatedPost = await db
      .select({
        id: groupPosts.id,
        groupId: groupPosts.groupId,
        content: groupPosts.content,
        imageUrl: groupPosts.imageUrl,
        likesCount: groupPosts.likesCount,
        commentsCount: groupPosts.commentsCount,
        pinned: groupPosts.pinned,
        createdAt: groupPosts.createdAt,
        updatedAt: groupPosts.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          minecraftUsername: users.minecraftUsername,
          avatar: users.avatar,
          role: users.role,
          level: users.level,
        },
      })
      .from(groupPosts)
      .innerJoin(users, eq(groupPosts.userId, users.id))
      .where(eq(groupPosts.id, postId))
      .get();

    return NextResponse.json(updatedPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

/**
 * DELETE /api/groups/[id]/posts/[postId] - Delete a post
 * Can be used by post author or group admin/moderator
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);
    const postId = parseInt(resolvedParams.postId);
    
    if (isNaN(groupId) || isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Get the post
    const post = await db
      .select()
      .from(groupPosts)
      .where(eq(groupPosts.id, postId))
      .get();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check permissions
    const isAuthor = post.userId === Number(session.user.id);
    const isSiteAdmin = session.user.role === 'admin' || session.user.role === 'moderator';
    
    // Check if user is group admin/moderator
    const membership = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, Number(session.user.id))
        )
      )
      .get();

    const isGroupModerator = membership && (membership.role === 'admin' || membership.role === 'moderator');
    const canDelete = isAuthor || isGroupModerator || isSiteAdmin;

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete the post (cascades to likes and comments)
    await db.delete(groupPosts).where(eq(groupPosts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
