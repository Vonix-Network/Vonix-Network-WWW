import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, minecraftUsername } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Username, email, and password are required',
          user: null,
          token: null
        },
        { status: 400 }
      );
    }

    // Validate username length
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Username must be between 3 and 20 characters',
          user: null,
          token: null
        },
        { status: 400 }
      );
    }

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email format',
          user: null,
          token: null
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Password must be at least 6 characters long',
          user: null,
          token: null
        },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await db.query.users.findFirst({
      where: or(
        eq(users.username, username),
        eq(users.email, email)
      ),
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'Username' : 'Email';
      return NextResponse.json(
        { 
          success: false, 
          message: `${field} already exists`,
          user: null,
          token: null
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const [newUser] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      minecraftUsername: minecraftUsername || null,
      role: 'user',
      xp: 0,
      level: 1,
    }).returning();

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
        id: newUser.id.toString(),
        username: newUser.username,
        role: newUser.role,
        minecraftUsername: newUser.minecraftUsername,
      },
      secret,
      { 
        expiresIn: '30d',
        algorithm: 'HS256'
      }
    );

    // Return user data (excluding sensitive fields)
    const userData = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      minecraftUsername: newUser.minecraftUsername,
      minecraftUuid: newUser.minecraftUuid,
      avatar: newUser.avatar,
      bio: newUser.bio,
      role: newUser.role,
      xp: newUser.xp,
      level: newUser.level,
      donationRankId: newUser.donationRankId,
      totalDonated: newUser.totalDonated,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    return NextResponse.json({
      success: true,
      user: userData,
      token: token,
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Registration error:', error);
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
