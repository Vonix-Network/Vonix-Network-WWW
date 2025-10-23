import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { groups, groupMembers, users } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/groups
 * Get all groups or user's groups
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const myGroups = searchParams.get('my') === 'true';
    const session = await getServerSession(authOptions);

    if (myGroups && !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let groupsList;

    if (myGroups) {
      const userId = parseInt(session!.user!.id);
      
      // Get groups user is a member of
      groupsList = await db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          coverImage: groups.coverImage,
          creatorId: groups.creatorId,
          creatorUsername: users.username,
          privacy: groups.privacy,
          createdAt: groups.createdAt,
          memberCount: sql<number>`(
            SELECT COUNT(*) FROM ${groupMembers} 
            WHERE ${groupMembers.groupId} = ${groups.id}
          )`,
          userRole: groupMembers.role,
        })
        .from(groupMembers)
        .innerJoin(groups, eq(groupMembers.groupId, groups.id))
        .leftJoin(users, eq(groups.creatorId, users.id))
        .where(eq(groupMembers.userId, userId))
        .orderBy(desc(groups.createdAt));
    } else {
      // Get all public groups
      groupsList = await db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          coverImage: groups.coverImage,
          creatorId: groups.creatorId,
          creatorUsername: users.username,
          privacy: groups.privacy,
          createdAt: groups.createdAt,
          memberCount: sql<number>`(
            SELECT COUNT(*) FROM ${groupMembers} 
            WHERE ${groupMembers.groupId} = ${groups.id}
          )`,
        })
        .from(groups)
        .leftJoin(users, eq(groups.creatorId, users.id))
        .where(eq(groups.privacy, 'public'))
        .orderBy(desc(groups.createdAt));
    }

    return NextResponse.json(groupsList);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/groups
 * Create a new group
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { name, description, coverImage, privacy } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Group name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Create group
    const [group] = await db
      .insert(groups)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        coverImage: coverImage || null,
        creatorId: userId,
        privacy: privacy || 'public',
        createdAt: new Date(),
      })
      .returning();

    // Add creator as admin member
    await db.insert(groupMembers).values({
      groupId: group.id,
      userId,
      role: 'admin',
      joinedAt: new Date(),
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
