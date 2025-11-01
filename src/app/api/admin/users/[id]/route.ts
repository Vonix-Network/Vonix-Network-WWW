import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get target user to check their role
    const [targetUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent non-superadmins from modifying superadmins
    if (targetUser.role === 'superadmin' && session.user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Only superadmins can modify superadmin users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, password, role, minecraftUsername, bio, avatar } = body;

    // Build update object
    const updateData: any = {};

    if (username !== undefined) {
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 });
      }
      updateData.username = username.trim();
    }

    if (email !== undefined) {
      updateData.email = email?.trim() || null;
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (role !== undefined) {
      // Validate role
      if (!['user', 'moderator', 'admin', 'superadmin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      // Superadmin role can NEVER be assigned through the UI
      if (role === 'superadmin') {
        return NextResponse.json(
          { error: 'Superadmin role can only be assigned via direct database access' },
          { status: 403 }
        );
      }

      // Non-superadmins cannot assign admin role
      if (role === 'admin' && session.user.role !== 'superadmin') {
        return NextResponse.json(
          { error: 'Only superadmins can assign admin role' },
          { status: 403 }
        );
      }

      updateData.role = role;
    }

    if (minecraftUsername !== undefined) {
      updateData.minecraftUsername = minecraftUsername?.trim() || null;
      
      // Automatically fetch and update UUID when Minecraft username changes
      if (minecraftUsername?.trim()) {
        console.log(`Fetching UUID for Minecraft username: ${minecraftUsername}`);
        const minecraftUuid = await fetchMinecraftUUID(minecraftUsername.trim());
        
        if (minecraftUuid) {
          console.log(`✅ Found UUID: ${minecraftUuid}`);
          updateData.minecraftUuid = minecraftUuid;
        } else {
          console.log(`⚠️ Could not find UUID for ${minecraftUsername}`);
          updateData.minecraftUuid = null;
        }
      } else {
        // Clear UUID if Minecraft username is removed
        updateData.minecraftUuid = null;
      }
    }

    if (bio !== undefined) {
      updateData.bio = bio?.trim() || null;
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar?.trim() || null;
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        minecraftUsername: users.minecraftUsername,
        minecraftUuid: users.minecraftUuid,
        bio: users.bio,
        avatar: users.avatar,
        createdAt: users.createdAt,
      });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent self-deletion
    if (parseInt(session.user.id) === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Get target user to check their role
    const [targetUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent non-superadmins from deleting superadmins
    if (targetUser.role === 'superadmin' && session.user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Only superadmins can delete superadmin users' },
        { status: 403 }
      );
    }

    // Delete the user (cascade will handle related records)
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
