import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/settings/background
 * Get current background setting
 */
export async function GET() {
  try {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'background'))
      .limit(1);

    return NextResponse.json({
      background: setting?.value || 'space'
    });
  } catch (error) {
    console.error('Error fetching background setting:', error);
    return NextResponse.json({ background: 'space' });
  }
}

/**
 * POST /api/settings/background
 * Update background setting (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { background } = body;

    // Validate background type
    const validBackgrounds = ['space', 'matrix', 'data', 'pixels', 'neural', 'none'];
    if (!validBackgrounds.includes(background)) {
      return NextResponse.json(
        { error: 'Invalid background type' },
        { status: 400 }
      );
    }

    // Update or insert setting
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'background'))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(settings)
        .set({
          value: background,
          updatedAt: new Date()
        })
        .where(eq(settings.key, 'background'));
    } else {
      await db.insert(settings).values({
        key: 'background',
        value: background,
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      background
    });
  } catch (error) {
    console.error('Error updating background:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
