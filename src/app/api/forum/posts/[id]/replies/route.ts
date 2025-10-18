import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { forumReplies, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    noStore();

    const postId = parseInt(params.id);
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