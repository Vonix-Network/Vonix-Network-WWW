import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { registrationCodes } from '@/db/schema';
import { generateCode } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * POST /api/registration/generate
 * Generate a registration code (admin only, for web UI)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { minecraftUsername } = body;

    if (!minecraftUsername || !minecraftUsername.trim()) {
      return NextResponse.json(
        { error: 'Minecraft username is required' },
        { status: 400 }
      );
    }

    // Generate unique code
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

    // Set expiration to 30 days from now (for admin-generated codes)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Insert code (without UUID since it's admin-generated)
    const [newCode] = await db
      .insert(registrationCodes)
      .values({
        code: code!,
        minecraftUsername: minecraftUsername.trim(),
        minecraftUuid: '', // Empty UUID for admin-generated codes
        used: false,
        expiresAt,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newCode, { status: 201 });
  } catch (error) {
    console.error('Error generating registration code:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration code' },
      { status: 500 }
    );
  }
}
