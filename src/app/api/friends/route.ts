import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { friendships, users } from '@/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { notifyFriendRequest } from '@/lib/notifications';

// GET /api/friends - Get user's friends
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'accepted';

    // Get friendships where user is either userId or friendId
    const friendshipsList = await db
      .select({
        id: friendships.id,
        userId: friendships.userId,
        friendId: friendships.friendId,
        status: friendships.status,
        createdAt: friendships.createdAt,
        updatedAt: friendships.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          avatar: users.avatar,
          role: users.role,
          minecraftUsername: users.minecraftUsername,
        },
      })
      .from(friendships)
      .leftJoin(users, eq(users.id, friendships.friendId))
      .where(
        and(
          or(
            eq(friendships.userId, userId),
            eq(friendships.friendId, userId)
          ),
          eq(friendships.status, status as 'pending' | 'accepted' | 'blocked')
        )
      )
      .orderBy(desc(friendships.createdAt));

    // Transform the data to show the friend's info
    const friends = friendshipsList.map(f => {
      const isSender = f.userId === userId;
      return {
        id: f.id,
        status: f.status,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        isSender,
        friend: f.user,
      };
    });

    return NextResponse.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

// POST /api/friends - Send friend request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    
    const schema = z.object({
      friendId: z.number(),
    });

    const { friendId } = schema.parse(body);

    // Can't friend yourself
    if (userId === friendId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if friendship already exists
    const existing = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
          and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Friend request already exists' },
        { status: 400 }
      );
    }

    // Create friend request
    const [friendship] = await db
      .insert(friendships)
      .values({
        userId,
        friendId,
        status: 'pending',
      })
      .returning();

    // Send notification to the friend
    await notifyFriendRequest(friendId, session.user.name || 'Someone', userId);

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    console.error('Error creating friend request:', error);
    return NextResponse.json(
      { error: 'Failed to create friend request' },
      { status: 500 }
    );
  }
}
