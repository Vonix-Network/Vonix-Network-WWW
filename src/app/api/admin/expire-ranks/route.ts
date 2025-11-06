import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { RBAC } from '@/lib/rbac';
import { removeExpiredRanks } from '@/lib/rank-subscription';

/**
 * Admin endpoint to manually trigger rank expiration cleanup
 * GET /api/admin/expire-ranks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    // Only admins can trigger this
    if (!session?.user || !RBAC.canAccessAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log(`🔧 Admin ${session.user.username} triggered manual rank expiration check`);

    // Run the expiration cleanup
    const result = await removeExpiredRanks();

    return NextResponse.json({
      success: true,
      removed: result.removed,
      users: result.users,
      triggeredBy: session.user.username,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in manual rank expiration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to expire ranks' },
      { status: 500 }
    );
  }
}
