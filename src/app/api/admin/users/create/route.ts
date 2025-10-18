import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

/**
 * Fetch Minecraft UUID from username using Mojang API
 */
async function fetchMinecraftUUID(minecraftUsername: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${minecraftUsername}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Failed to fetch UUID for ${minecraftUsername}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Format UUID with dashes (Mojang returns without dashes)
    const uuid = data.id;
    if (uuid && uuid.length === 32) {
      return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
    }
    
    return uuid;
  } catch (error) {
    console.error(`Error fetching Minecraft UUID for ${minecraftUsername}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, email, password, role, minecraftUsername, bio } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (role && !['user', 'moderator', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Fetch Minecraft UUID if username is provided
    let minecraftUuid: string | null = null;
    if (minecraftUsername?.trim()) {
      console.log(`Fetching UUID for Minecraft username: ${minecraftUsername}`);
      minecraftUuid = await fetchMinecraftUUID(minecraftUsername.trim());
      
      if (minecraftUuid) {
        console.log(`✅ Found UUID: ${minecraftUuid}`);
      } else {
        console.log(`⚠️ Could not find UUID for ${minecraftUsername} - user may not exist or API error`);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username: username.trim(),
        email: email?.trim() || null,
        password: hashedPassword,
        role: role || 'user',
        minecraftUsername: minecraftUsername?.trim() || null,
        minecraftUuid: minecraftUuid,
        bio: bio?.trim() || null,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        minecraftUsername: users.minecraftUsername,
        minecraftUuid: users.minecraftUuid,
        createdAt: users.createdAt,
      });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
