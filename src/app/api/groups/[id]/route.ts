import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { groups, groupMembers, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/groups/[id]
 * Get group details with members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);
    const session = await auth();

    // Get group details
    const [group] = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        coverImage: groups.coverImage,
        creatorId: groups.creatorId,
        creatorUsername: users.username,
        privacy: groups.privacy,
        createdAt: groups.createdAt,
      })
      .from(groups)
      .leftJoin(users, eq(groups.creatorId, users.id))
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get members
    const members = await db
      .select({
        id: groupMembers.id,
        userId: groupMembers.userId,
        username: users.username,
        minecraftUsername: users.minecraftUsername,
        avatar: users.avatar,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));

    // Check if current user is a member
    const userMembership = session?.user?.id
      ? members.find((m) => m.userId === parseInt(session.user.id))
      : null;

    return NextResponse.json({
      ...group,
      members,
      memberCount: members.length,
      userMembership: userMembership || null,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/groups/[id]
 * Update group details (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);
    const userId = parseInt(session.user.id);
    const body = await request.json();

    // Check if user is group admin
    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        )
      )
      .limit(1);

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update group
    const updateData: any = {};
    
    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }
    if (body.coverImage !== undefined) {
      updateData.coverImage = body.coverImage?.trim() || null;
    }
    if (body.privacy !== undefined) {
      updateData.privacy = body.privacy;
    }

    const [updated] = await db
      .update(groups)
      .set(updateData)
      .where(eq(groups.id, groupId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/groups/[id]
 * Delete a group (creator only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);
    const userId = parseInt(session.user.id);

    // Get group
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check permissions (creator or admin)
    if (group.creatorId !== userId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete group (members will cascade)
    await db.delete(groups).where(eq(groups.id, groupId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
