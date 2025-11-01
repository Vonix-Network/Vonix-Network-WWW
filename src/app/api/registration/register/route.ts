import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { registrationCodes, users } from '@/db/schema';
import { minecraftRegisterSchema } from '@/lib/validation';
import { eq, and } from 'drizzle-orm';
import { SignJWT } from 'jose';

/**
 * POST /api/registration/register
 * Complete registration using a generated code
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const validation = minecraftRegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { code, password } = validation.data;

    // Find registration code
    const regCode = await db.query.registrationCodes.findFirst({
      where: and(
        eq(registrationCodes.code, code),
        eq(registrationCodes.used, false)
      ),
    });

    if (!regCode) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // Check if code is expired
    const now = new Date();
    if (regCode.expiresAt < now) {
      return NextResponse.json(
        { error: 'Code has expired' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.minecraftUuid, regCode.minecraftUuid),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Account already exists for this Minecraft account' },
        { status: 400 }
      );
    }

    // Hash password with BCrypt work factor 12 (matches mod expectations)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [newUser] = await db.insert(users).values({
      username: regCode.minecraftUsername,
      password: hashedPassword,
      minecraftUsername: regCode.minecraftUsername,
      minecraftUuid: regCode.minecraftUuid,
      role: 'user',
    }).returning();

    // Mark code as used
    await db.update(registrationCodes)
      .set({
        used: true,
        userId: newUser.id,
        usedAt: now,
      })
      .where(eq(registrationCodes.id, regCode.id));

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');
    const token = await new SignJWT({ 
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        minecraft_username: newUser.minecraftUsername,
        minecraft_uuid: newUser.minecraftUuid,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Registration failed';
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Log full error for admin debugging
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      
      // Check for specific database errors
      if (error.message.includes('UNIQUE constraint') || error.message.includes('duplicate')) {
        errorMessage = 'This account is already registered';
        statusCode = 409;
      } else if (error.message.includes('foreign key') || error.message.includes('violates')) {
        errorMessage = 'Invalid account data';
        statusCode = 400;
      } else if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Database connection failed';
        statusCode = 503;
      } else if (error.message.includes('minecraftUsername')) {
        errorMessage = 'Registration code is invalid or corrupted';
        statusCode = 400;
      } else {
        // For other errors, include part of the error message for debugging
        errorMessage = `Server error: ${error.message.substring(0, 100)}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: statusCode }
    );
  }
}
