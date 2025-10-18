import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { socialPosts, forumPosts, forumReplies, privateMessages } from '@/db/schema';
import { sql, isNull, or, lt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    let result = { success: false, message: '', deletedCount: 0 };

    switch (action) {
      case 'delete_invalid_timestamps':
        // Delete posts with null or invalid timestamps
        const deletedSocialPosts = await db
          .delete(socialPosts)
          .where(or(
            isNull(socialPosts.createdAt),
            lt(socialPosts.createdAt, sql`1000000000`) // Before year 2001
          ))
          .returning({ id: socialPosts.id });

        const deletedForumPosts = await db
          .delete(forumPosts)
          .where(or(
            isNull(forumPosts.createdAt),
            lt(forumPosts.createdAt, sql`1000000000`)
          ))
          .returning({ id: forumPosts.id });

        const deletedForumReplies = await db
          .delete(forumReplies)
          .where(or(
            isNull(forumReplies.createdAt),
            lt(forumReplies.createdAt, sql`1000000000`)
          ))
          .returning({ id: forumReplies.id });

        result = {
          success: true,
          message: `Deleted ${deletedSocialPosts.length} social posts, ${deletedForumPosts.length} forum posts, and ${deletedForumReplies.length} forum replies with invalid timestamps`,
          deletedCount: deletedSocialPosts.length + deletedForumPosts.length + deletedForumReplies.length
        };
        break;

      case 'fix_timestamps':
        // Update null timestamps to current time
        const currentTime = Math.floor(Date.now() / 1000);
        
        await db
          .update(socialPosts)
          .set({ createdAt: sql`${currentTime}` })
          .where(isNull(socialPosts.createdAt));

        await db
          .update(forumPosts)
          .set({ createdAt: sql`${currentTime}`, updatedAt: sql`${currentTime}` })
          .where(isNull(forumPosts.createdAt));

        await db
          .update(forumReplies)
          .set({ createdAt: sql`${currentTime}` })
          .where(isNull(forumReplies.createdAt));

        result = {
          success: true,
          message: 'Fixed all null timestamps with current time',
          deletedCount: 0
        };
        break;

      case 'delete_orphaned_replies':
        // Delete forum replies that reference non-existent posts
        const orphanedReplies = await db
          .delete(forumReplies)
          .where(sql`${forumReplies.postId} NOT IN (SELECT id FROM ${forumPosts})`)
          .returning({ id: forumReplies.id });

        result = {
          success: true,
          message: `Deleted ${orphanedReplies.length} orphaned forum replies`,
          deletedCount: orphanedReplies.length
        };
        break;

      case 'delete_orphaned_messages':
        // Delete messages from deleted users
        const orphanedMessages = await db
          .delete(privateMessages)
          .where(sql`${privateMessages.senderId} NOT IN (SELECT id FROM users) OR ${privateMessages.recipientId} NOT IN (SELECT id FROM users)`)
          .returning({ id: privateMessages.id });

        result = {
          success: true,
          message: `Deleted ${orphanedMessages.length} orphaned messages`,
          deletedCount: orphanedMessages.length
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error performing cleanup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
