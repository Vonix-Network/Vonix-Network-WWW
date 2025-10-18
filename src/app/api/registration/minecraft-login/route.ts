import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { minecraftLoginSchema } from '@/lib/validation';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { verifyApiKey } from '@/lib/verify-api-key';

/**
 * POST /api/registration/minecraft-login
 * Authenticate Minecraft players with their password
 * Requires X-API-Key header for authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Verify API key from database
    const apiKey = req.headers.get('x-api-key');
    const isValidKey = await verifyApiKey(apiKey);
    
    if (!isValidKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const validation = minecraftLoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { minecraft_username, minecraft_uuid, password } = validation.data;

    // Find user by UUID
    const user = await db.query.users.findFirst({
      where: eq(users.minecraftUuid, minecraft_uuid),
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Update Minecraft username if it changed
    if (user.minecraftUsername !== minecraft_username) {
      await db.update(users)
        .set({ 
          minecraftUsername: minecraft_username,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');
    const token = await new SignJWT({ 
      userId: user.id,
      username: user.username,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    return NextResponse.json({
      success: true,
      message: `Welcome back, ${minecraft_username}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        minecraft_username: minecraft_username,
        minecraft_uuid: user.minecraftUuid,
        role: user.role,
        total_donated: user.totalDonated || 0,
        donation_rank_id: user.donationRankId,
      },
    });
  } catch (error) {
    console.error('Minecraft login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
