import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { checkRegistrationSchema } from '@/lib/validation';
import { eq } from 'drizzle-orm';
import { verifyApiKey } from '@/lib/verify-api-key';

/**
 * POST /api/registration/check-registration
 * Check if a Minecraft player is registered
 * Requires X-API-Key header for authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Verify API key from database
    const apiKey = req.headers.get('x-api-key');
    const isValidKey = await verifyApiKey(apiKey);
    
    if (!isValidKey) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const validation = checkRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { minecraft_uuid } = validation.data;

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.minecraftUuid, minecraft_uuid),
    });

    if (!user) {
      return NextResponse.json({
        registered: false,
        message: 'User not registered',
      });
    }

    // Fetch donation rank details if user has one
    let donationRank = null;
    if (user.donationRankId) {
      const [rank] = await db
        .select()
        .from(donationRanks)
        .where(eq(donationRanks.id, user.donationRankId))
        .limit(1);
      
      donationRank = rank || null;
    }

    // Check if rank is expired
    const now = Date.now();
    const hasValidRank = user.donationRankId && 
                        user.rankExpiresAt && 
                        user.rankExpiresAt.getTime() > now &&
                        donationRank !== null;

    // Return user info if registered
    return NextResponse.json({
      registered: true,
      message: 'User is registered',
      user: {
        id: user.id,
        username: user.username,
        minecraft_username: user.minecraftUsername,
        minecraft_uuid: user.minecraftUuid,
        role: user.role,
        total_donated: user.totalDonated || 0,
        donation_rank_id: user.donationRankId,
        donation_rank: hasValidRank && donationRank ? {
          id: donationRank.id,
          name: donationRank.name,
          color: donationRank.color,
          expires_at: user.rankExpiresAt?.toISOString(),
        } : null,
      },
    });
  } catch (error) {
    console.error('Check registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
