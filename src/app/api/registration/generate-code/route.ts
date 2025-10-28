import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { registrationCodes, users } from '@/db/schema';
import { generateCodeSchema } from '@/lib/validation';
import { generateCode } from '@/lib/utils';
import { eq, and } from 'drizzle-orm';
import { verifyApiKey } from '@/lib/verify-api-key';

/**
 * POST /api/registration/generate-code
 * Generate a registration code for Minecraft players
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
    const validation = generateCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { minecraft_username, minecraft_uuid } = validation.data;

    // Check if player is already registered
    const existingUser = await db.query.users.findFirst({
      where: eq(users.minecraftUuid, minecraft_uuid),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Player already registered' },
        { status: 400 }
      );
    }

    // Check for existing unused code
    const existingCode = await db.query.registrationCodes.findFirst({
      where: and(
        eq(registrationCodes.minecraftUuid, minecraft_uuid),
        eq(registrationCodes.used, false)
      ),
    });

    if (existingCode) {
      // Check if still valid
      const now = new Date();
      if (existingCode.expiresAt > now) {
        const expiresIn = Math.floor((existingCode.expiresAt.getTime() - now.getTime()) / 1000);
        return NextResponse.json({
          code: existingCode.code,
          expires_in: expiresIn,
          minecraft_username,
        });
      }
    }

    // Generate new code
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateCode(6);
      const codeExists = await db.query.registrationCodes.findFirst({
        where: eq(registrationCodes.code, code),
      });
      if (!codeExists) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique code' },
        { status: 500 }
      );
    }

    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Insert code
    await db.insert(registrationCodes).values({
      code: code!,
      minecraftUsername: minecraft_username,
      minecraftUuid: minecraft_uuid,
      expiresAt,
    });

    return NextResponse.json({
      code: code!,
      expires_in: 600,
      minecraft_username,
    });
  } catch (error) {
    console.error('Generate code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
