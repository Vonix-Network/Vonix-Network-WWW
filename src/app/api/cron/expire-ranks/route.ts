import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { lt, isNotNull, and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

// This endpoint should be called by a cron job (e.g., Vercel Cron, external scheduler)
// Run every hour to check for expired ranks

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    console.log(`🕐 Running rank expiration check at ${now.toISOString()}`);

    // Find all users with expired ranks
    const expiredUsers = await db
      .select({
        id: users.id,
        username: users.username,
        donationRankId: users.donationRankId,
        rankExpiresAt: users.rankExpiresAt,
      })
      .from(users)
      .where(
        and(
          isNotNull(users.donationRankId),
          isNotNull(users.rankExpiresAt),
          lt(users.rankExpiresAt, now)
        )
      )
      .limit(100); // Process in batches

    let removed = 0;
    const removedUsers: Array<{ id: number; username: string; rankId: string }> = [];

    // Remove expired ranks
    for (const user of expiredUsers) {
      try {
        await db
          .update(users)
          .set({
            donationRankId: null,
            rankExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        removed++;
        removedUsers.push({
          id: user.id,
          username: user.username,
          rankId: user.donationRankId!,
        });

        console.log(`⏰ Removed expired rank ${user.donationRankId} from user ${user.username} (ID: ${user.id})`);
      } catch (error) {
        console.error(`❌ Failed to remove rank for user ${user.id}:`, error);
      }
    }

    // Log results
    console.log(`✅ Rank expiration check complete: ${removed} ranks removed`);

    return NextResponse.json({
      success: true,
      checked: expiredUsers.length,
      removed,
      removedUsers,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Rank expiration cron error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
