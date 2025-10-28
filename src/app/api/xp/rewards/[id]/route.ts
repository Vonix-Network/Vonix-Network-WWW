import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { levelRewards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/xp/rewards/[id]
 * Update a level reward (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const rewardId = parseInt(resolvedParams.id);
    const body = await request.json();

    const [updated] = await db
      .update(levelRewards)
      .set({
        title: body.title !== undefined ? body.title : undefined,
        badge: body.badge !== undefined ? body.badge : undefined,
        description: body.description !== undefined ? body.description : undefined,
        rewardType: body.rewardType !== undefined ? body.rewardType : undefined,
        rewardValue: body.rewardValue !== undefined ? body.rewardValue : undefined,
      })
      .where(eq(levelRewards.id, rewardId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating level reward:', error);
    return NextResponse.json(
      { error: 'Failed to update level reward' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/xp/rewards/[id]
 * Delete a level reward (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const rewardId = parseInt(resolvedParams.id);

    await db.delete(levelRewards).where(eq(levelRewards.id, rewardId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting level reward:', error);
    return NextResponse.json(
      { error: 'Failed to delete level reward' },
      { status: 500 }
    );
  }
}
