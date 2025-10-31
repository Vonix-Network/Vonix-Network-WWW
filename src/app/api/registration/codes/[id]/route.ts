import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { registrationCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/registration/codes/[id]
 * Delete a registration code (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const codeId = parseInt(resolvedParams.id);

    await db.delete(registrationCodes).where(eq(registrationCodes.id, codeId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting registration code:', error);
    return NextResponse.json(
      { error: 'Failed to delete registration code' },
      { status: 500 }
    );
  }
}
