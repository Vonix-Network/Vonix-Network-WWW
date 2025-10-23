import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { groupMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/groups/[id]/members/[memberId]
 * Update member role (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = parseInt(params.id);
    const memberId = parseInt(params.memberId);
    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!['member', 'moderator', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if requesting user is group admin
    const [requesterMembership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        )
      )
      .limit(1);

    if (!requesterMembership || requesterMembership.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Get target member
    const [targetMember] = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.id, memberId))
      .limit(1);

    if (!targetMember || targetMember.groupId !== groupId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent demoting yourself if you're the only admin
    if (targetMember.userId === userId && role !== 'admin') {
      const adminCount = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.role, 'admin')
          )
        );

      if (adminCount.length === 1) {
        return NextResponse.json(
          { error: 'Cannot demote yourself as the only admin' },
          { status: 400 }
        );
      }
    }

    // Update role
    const [updated] = await db
      .update(groupMembers)
      .set({ role })
      .where(eq(groupMembers.id, memberId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/groups/[id]/members/[memberId]
 * Remove member from group (admin/moderator)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = parseInt(params.id);
    const memberId = parseInt(params.memberId);
    const userId = parseInt(session.user.id);

    // Check requester's permissions
    const [requesterMembership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        )
      )
      .limit(1);

    if (!requesterMembership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    // Get target member
    const [targetMember] = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.id, memberId))
      .limit(1);

    if (!targetMember || targetMember.groupId !== groupId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Permission check: admins can remove anyone, moderators can only remove members
    const canRemove =
      requesterMembership.role === 'admin' ||
      (requesterMembership.role === 'moderator' && targetMember.role === 'member');

    if (!canRemove) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Prevent removing yourself if you're the only admin
    if (targetMember.userId === userId && targetMember.role === 'admin') {
      const adminCount = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.role, 'admin')
          )
        );

      if (adminCount.length === 1) {
        return NextResponse.json(
          { error: 'Cannot remove yourself as the only admin' },
          { status: 400 }
        );
      }
    }

    // Remove member
    await db.delete(groupMembers).where(eq(groupMembers.id, memberId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
