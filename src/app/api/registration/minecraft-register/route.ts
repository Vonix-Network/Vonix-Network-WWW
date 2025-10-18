import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { verifyApiKey } from '@/lib/verify-api-key';

// Validation schema for direct registration
const directRegistrationSchema = z.object({
  minecraft_username: z.string().min(1).max(16),
  minecraft_uuid: z.string().uuid(),
  password: z.string().min(6).max(128),
});

export async function POST(request: NextRequest) {
  try {
    // Verify API key from database
    const apiKey = request.headers.get('X-API-Key');
    const isValidKey = await verifyApiKey(apiKey);
    
    if (!isValidKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = directRegistrationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { minecraft_username, minecraft_uuid, password } = validation.data;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.minecraftUuid, minecraft_uuid))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Player already registered' },
        { status: 409 }
      );
    }

    // Hash password with BCrypt (work factor 12 to match mod)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        username: minecraft_username,
        minecraftUsername: minecraft_username,
        minecraftUuid: minecraft_uuid,
        password: hashedPassword,
        role: 'user',
        totalDonated: 0,
      })
      .returning();

    // Return success response matching mod expectations
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      token: `session-${minecraft_uuid}`, // Simple session token
      user: {
        id: newUser.id,
        username: newUser.username,
        minecraft_username: newUser.minecraftUsername,
        minecraft_uuid: newUser.minecraftUuid,
        role: newUser.role,
        total_donated: newUser.totalDonated,
        donation_rank_id: newUser.donationRankId,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Direct registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
