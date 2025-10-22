import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Username and password are required',
          user: null,
          token: null
        },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid username or password',
          user: null,
          token: null
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid username or password',
          user: null,
          token: null
        },
        { status: 401 }
      );
    }

    // Create JWT token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET is not configured');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Server configuration error',
          user: null,
          token: null
        },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        id: user.id.toString(),
        username: user.username,
        role: user.role,
        minecraftUsername: user.minecraftUsername,
        minecraftUuid: user.minecraftUuid,
      },
      secret,
      { 
        expiresIn: '30d',
        algorithm: 'HS256'
      }
    );

    // Return user data (excluding sensitive fields)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      minecraftUsername: user.minecraftUsername,
      minecraftUuid: user.minecraftUuid,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      xp: user.xp,
      level: user.level,
      donationRankId: user.donationRankId,
      totalDonated: user.totalDonated,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json({
      success: true,
      user: userData,
      token: token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        user: null,
        token: null
      },
      { status: 500 }
    );
  }
}
