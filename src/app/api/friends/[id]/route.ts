import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { friendships } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { notifyFriendAccepted } from '@/lib/notifications';
import { awardXP, XP_REWARDS } from '@/lib/xp-system';

// PATCH /api/friends/[id] - Accept/reject friend request
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const friendshipId = parseInt(params.id);
    
    if (isNaN(friendshipId)) {
      return NextResponse.json({ error: 'Invalid friendship ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body; // 'accept' or 'reject' or 'block'

    if (!['accept', 'reject', 'block'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get the friendship
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(eq(friendships.id, friendshipId))
      .limit(1);

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    // Only the recipient can accept/reject
    if (friendship.friendId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'accept') {
      const [updated] = await db
        .update(friendships)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(friendships.id, friendshipId))
        .returning();

      // Notify the sender
      await notifyFriendAccepted(friendship.userId, session.user.name || 'Someone');

      // Award XP to both users for making a friend
      try {
        // Award XP to the person who accepted
        await awardXP(
          userId,
          XP_REWARDS.FRIEND_REQUEST_ACCEPTED,
          'friend_accepted',
          friendship.userId,
          'Accepted friend request'
        );

        // Award XP to the person who sent the request
        await awardXP(
          friendship.userId,
          XP_REWARDS.FRIEND_REQUEST_ACCEPTED,
          'friend_accepted',
          userId,
          'Friend request accepted'
        );
      } catch (xpError) {
        console.error('Error awarding friend XP:', xpError);
        // Don't fail the request if XP fails
      }

      return NextResponse.json(updated);
    } else if (action === 'block') {
      const [updated] = await db
        .update(friendships)
        .set({ status: 'blocked', updatedAt: new Date() })
        .where(eq(friendships.id, friendshipId))
        .returning();

      return NextResponse.json(updated);
    } else {
      // reject - delete the friendship
      await db
        .delete(friendships)
        .where(eq(friendships.id, friendshipId));

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error updating friendship:', error);
    return NextResponse.json(
      { error: 'Failed to update friendship' },
      { status: 500 }
    );
  }
}

// DELETE /api/friends/[id] - Remove friend
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const friendshipId = parseInt(params.id);
    
    if (isNaN(friendshipId)) {
      return NextResponse.json({ error: 'Invalid friendship ID' }, { status: 400 });
    }

    // Delete friendship where user is either party
    await db
      .delete(friendships)
      .where(
        and(
          eq(friendships.id, friendshipId),
          or(
            eq(friendships.userId, userId),
            eq(friendships.friendId, userId)
          )
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting friendship:', error);
    return NextResponse.json(
      { error: 'Failed to delete friendship' },
      { status: 500 }
    );
  }
}
