import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

// WebSocket broadcast function
async function broadcastToWebSocketClients(type: string, data: any) {
  try {
    await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ws`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });
  } catch (error) {
    console.error('Failed to broadcast WebSocket message:', error);
  }
}

/**
 * GET /api/admin/users/[id]/donation-rank
 * Get user's current donation rank info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        donationRankId: users.donationRankId,
        rankExpiresAt: users.rankExpiresAt,
        totalDonated: users.totalDonated,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let rank = null;
    if (user.donationRankId) {
      const [rankData] = await db
        .select()
        .from(donationRanks)
        .where(eq(donationRanks.id, user.donationRankId));
      rank = rankData;
    }

    return NextResponse.json({ user, rank }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching user donation rank:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/[id]/donation-rank
 * Assign or update user's donation rank
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const { rankId, totalDonated, expiresInDays } = body;

    // Validate rank exists if provided
    if (rankId) {
      const [rank] = await db
        .select()
        .from(donationRanks)
        .where(eq(donationRanks.id, rankId));
      
      if (!rank) {
        return NextResponse.json({ error: 'Invalid rank ID' }, { status: 400 });
      }
    }

    // Calculate expiration date
    let rankExpiresAt = null;
    if (rankId && expiresInDays) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expiresInDays);
      rankExpiresAt = expirationDate;
    }

    // Update user
    await db
      .update(users)
      .set({
        donationRankId: rankId || null,
        rankExpiresAt: rankExpiresAt,
        totalDonated: totalDonated !== undefined ? totalDonated : 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Broadcast user rank update to all connected clients
    await broadcastToWebSocketClients('USER_RANK_UPDATED', {
      userId,
      rankId,
      totalDonated,
      rankExpiresAt
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating user donation rank:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]/donation-rank
 * Remove user's donation rank
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        donationRankId: null,
        rankExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Broadcast user rank removal to all connected clients
    await broadcastToWebSocketClients('USER_RANK_REMOVED', {
      userId,
      rankId: null,
      totalDonated: 0,
      rankExpiresAt: null
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error removing user donation rank:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
