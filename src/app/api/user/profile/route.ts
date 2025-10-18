import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bio, avatar } = body;

    // Validate bio length
    if (bio && bio.length > 500) {
      return NextResponse.json({ error: 'Bio must be 500 characters or less' }, { status: 400 });
    }

    // Validate avatar URL
    if (avatar && avatar.length > 0) {
      try {
        new URL(avatar);
      } catch {
        return NextResponse.json({ error: 'Invalid avatar URL' }, { status: 400 });
      }
    }

    await db
      .update(users)
      .set({
        bio: bio || null,
        avatar: avatar || null,
      })
      .where(eq(users.id, parseInt(session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
