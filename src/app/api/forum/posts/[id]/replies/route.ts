import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { forumReplies, forumPosts, users } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import { auth } from '@/lib/auth';
import { awardXP, XP_REWARDS } from '@/lib/xp-system';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    noStore();

    const resolvedParams = await params;
    const postId = parseInt(resolvedParams.id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Get replies
    const replies = await db
      .select({
        id: forumReplies.id,
        content: forumReplies.content,
        createdAt: forumReplies.createdAt,
        author: {
          id: users.id,
          username: users.username,
          avatar: users.avatar,
          minecraftUsername: users.minecraftUsername,
          role: users.role,
          donationRankId: users.donationRankId,
        },
      })
      .from(forumReplies)
      .leftJoin(users, eq(forumReplies.authorId, users.id))
      .where(eq(forumReplies.postId, postId))
      .orderBy(desc(forumReplies.createdAt));

    // Convert timestamps to Date objects with null check
    const repliesWithTimestamps = replies.map((reply) => ({
      ...reply,
      createdAt: reply.createdAt 
        ? (reply.createdAt instanceof Date 
            ? reply.createdAt 
            : new Date(typeof reply.createdAt === 'number' ? reply.createdAt * 1000 : reply.createdAt))
        : new Date(),
    }));

    return NextResponse.json({ replies: repliesWithTimestamps });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
    const postId = parseInt(resolvedParams.id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'Reply is too long (max 10,000 characters)' },
        { status: 400 }
      );
    }

    // Check if post exists and is not locked
    const [post] = await db
      .select({
        id: forumPosts.id,
        locked: forumPosts.locked,
      })
      .from(forumPosts)
      .where(eq(forumPosts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.locked) {
      return NextResponse.json(
        { error: 'This topic is locked and cannot accept new replies' },
        { status: 403 }
      );
    }

    // Create the reply
    const [reply] = await db
      .insert(forumReplies)
      .values({
        postId,
        authorId: parseInt(session.user.id),
        content: content.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update post's updatedAt timestamp
    await db
      .update(forumPosts)
      .set({ updatedAt: new Date() })
      .where(eq(forumPosts.id, postId));

    // Award XP for posting a reply
    try {
      await awardXP(
        parseInt(session.user.id),
        XP_REWARDS.FORUM_REPLY_CREATE,
        'forum_reply',
        reply.id,
        'Posted a forum reply'
      );
    } catch (xpError) {
      console.error('Error awarding XP for reply:', xpError);
      // Don't fail the request if XP awarding fails
    }

    // Fetch the complete reply data with author info
    const [completeReply] = await db
      .select({
        id: forumReplies.id,
        content: forumReplies.content,
        createdAt: forumReplies.createdAt,
        author: {
          id: users.id,
          username: users.username,
          avatar: users.avatar,
          minecraftUsername: users.minecraftUsername,
          role: users.role,
          donationRankId: users.donationRankId,
        },
      })
      .from(forumReplies)
      .leftJoin(users, eq(forumReplies.authorId, users.id))
      .where(eq(forumReplies.id, reply.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Reply posted successfully',
      reply: completeReply,
    });

  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}