import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { stories, users, storyViews } from '@/db/schema';
import { eq, gt, and, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/social/stories
 * Get all active stories (not expired)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const now = new Date();
    
    // Get all active stories with user info
    const activeStories = await db
      .select({
        id: stories.id,
        userId: stories.userId,
        username: users.username,
        minecraftUsername: users.minecraftUsername,
        avatar: users.avatar,
        content: stories.content,
        imageUrl: stories.imageUrl,
        backgroundColor: stories.backgroundColor,
        expiresAt: stories.expiresAt,
        createdAt: stories.createdAt,
        viewCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${storyViews} 
          WHERE ${storyViews.storyId} = ${stories.id}
        )`,
        hasViewed: session?.user?.id 
          ? sql<boolean>`EXISTS(
              SELECT 1 FROM ${storyViews} 
              WHERE ${storyViews.storyId} = ${stories.id} 
              AND ${storyViews.userId} = ${parseInt(session.user.id)}
            )`
          : sql<boolean>`false`,
      })
      .from(stories)
      .leftJoin(users, eq(stories.userId, users.id))
      .where(gt(stories.expiresAt, now))
      .orderBy(desc(stories.createdAt));

    return NextResponse.json(activeStories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social/stories
 * Create a new story
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { content, imageUrl, backgroundColor } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Story content is required' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Story content must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Stories expire after 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const [story] = await db
      .insert(stories)
      .values({
        userId,
        content: content.trim(),
        imageUrl: imageUrl || null,
        backgroundColor: backgroundColor || '#000000',
        expiresAt,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    );
  }
}
