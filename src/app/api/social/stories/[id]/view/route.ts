import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { storyViews } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * POST /api/social/stories/[id]/view
 * Mark a story as viewed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const storyId = parseInt(resolvedParams.id);
    const userId = parseInt(session.user.id);

    // Check if already viewed
    const [existing] = await db
      .select()
      .from(storyViews)
      .where(
        and(
          eq(storyViews.storyId, storyId),
          eq(storyViews.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ alreadyViewed: true });
    }

    // Create view record
    await db.insert(storyViews).values({
      storyId,
      userId,
      viewedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording story view:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
