import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { forumPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const lockSchema = z.object({
  locked: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or moderator
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = lockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { locked } = validation.data;

    // Update the post
    await db
      .update(forumPosts)
      .set({
        locked,
        updatedAt: new Date(),
      })
      .where(eq(forumPosts.id, postId));

    return NextResponse.json({
      success: true,
      message: locked ? 'Post locked successfully' : 'Post unlocked successfully',
    });

  } catch (error) {
    console.error('Error updating lock status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
