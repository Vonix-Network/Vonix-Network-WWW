import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Check if email is already in use by a different user
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email)));

    if (existing.length > 0 && String(existing[0].id) !== String(session.user.id)) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
    }

    await db
      .update(users)
      .set({ email, updatedAt: new Date() })
      .where(eq(users.id, Number(session.user.id)));

    return NextResponse.json({ success: true, message: 'Email updated' });
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}
