import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { registrationCodes } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/registration/codes
 * List all registration codes (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const codes = await db
      .select()
      .from(registrationCodes)
      .orderBy(desc(registrationCodes.createdAt));

    return NextResponse.json(codes);
  } catch (error) {
    console.error('Error fetching registration codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration codes' },
      { status: 500 }
    );
  }
}
