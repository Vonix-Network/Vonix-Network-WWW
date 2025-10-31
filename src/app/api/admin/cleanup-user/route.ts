import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, socialPosts, socialComments, forumPosts, forumReplies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    console.log(`Starting cleanup for user: ${username}`);

    // Find the user first
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete all related data first (foreign key constraints)
    console.log('Deleting social comments...');
    await db.delete(socialComments).where(eq(socialComments.userId, user.id));
    
    console.log('Deleting social posts...');
    await db.delete(socialPosts).where(eq(socialPosts.userId, user.id));
    
    console.log('Deleting forum replies...');
    await db.delete(forumReplies).where(eq(forumReplies.authorId, user.id));
    
    console.log('Deleting forum posts...');
    await db.delete(forumPosts).where(eq(forumPosts.authorId, user.id));
    
    // Finally delete the user
    console.log('Deleting user...');
    await db.delete(users).where(eq(users.id, user.id));

    console.log(`Successfully cleaned up user: ${username}`);

    return NextResponse.json({ 
      success: true, 
      message: `User ${username} and all related data deleted successfully` 
    });

  } catch (error) {
    console.error('Error during user cleanup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // List all users for admin reference
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        minecraftUsername: users.minecraftUsername,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.id);

    return NextResponse.json({ users: allUsers });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
