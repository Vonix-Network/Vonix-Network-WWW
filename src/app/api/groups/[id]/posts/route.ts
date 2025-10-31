import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { groupPosts, groupMembers, groups, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  imageUrl: z.string().url().optional(),
});

/**
 * GET /api/groups/[id]/posts - Get group posts with pagination
 * Query params:
 * - page: number (default: 1)
 * - limit: number (10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    // Check if group exists
    const group = await db.select().from(groups).where(eq(groups.id, groupId)).get();
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is a member (for private groups)
    if (group.privacy === 'private') {
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

      if (!membership) {
        return NextResponse.json({ error: 'You must be a member to view posts' }, { status: 403 });
      }
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limitParam = parseInt(searchParams.get('limit') || '10');
    
    // Validate limit (must be multiple of 10 between 10 and 200)
    const validLimits = Array.from({ length: 20 }, (_, i) => (i + 1) * 10);
    const limit = validLimits.includes(limitParam) ? limitParam : 10;
    
    const offset = (page - 1) * limit;

    // Get posts with author info
    const posts = await db
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
          donationRankId: users.donationRankId,
        },
      })
      .from(groupPosts)
      .innerJoin(users, eq(groupPosts.userId, users.id))
      .where(eq(groupPosts.groupId, groupId))
      .orderBy(desc(groupPosts.pinned), desc(groupPosts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalPosts = await db
      .select({ count: groupPosts.id })
      .from(groupPosts)
      .where(eq(groupPosts.groupId, groupId));

    const total = totalPosts.length;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching group posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

/**
 * POST /api/groups/[id]/posts - Create a new group post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    // Check if group exists
    const group = await db.select().from(groups).where(eq(groups.id, groupId)).get();
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is a member
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

    if (!membership) {
      return NextResponse.json({ error: 'You must be a member to post' }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    // Create the post
    const newPost = await db
      .insert(groupPosts)
      .values({
        groupId,
        userId: Number(session.user.id),
        content: validatedData.content,
        imageUrl: validatedData.imageUrl,
      })
      .returning();

    // Get the post with author info
    const postWithAuthor = await db
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
      .where(eq(groupPosts.id, newPost[0].id))
      .get();

    return NextResponse.json(postWithAuthor, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating group post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
