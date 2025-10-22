import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface MobileSession {
  id: string;
  username: string;
  role: string;
  minecraftUsername?: string;
  minecraftUuid?: string;
}

/**
 * Verify JWT token from mobile app
 * Returns user session if valid, null otherwise
 */
export async function verifyMobileToken(request: NextRequest): Promise<MobileSession | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return null;
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return null;
    }

    // Verify token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET is not configured');
      return null;
    }

    const decoded = jwt.verify(token, secret) as any;

    // Token is valid, return session
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      minecraftUsername: decoded.minecraftUsername,
      minecraftUuid: decoded.minecraftUuid,
    };
  } catch (error) {
    // Token is invalid or expired
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Get full user data from mobile session
 */
export async function getMobileUser(session: MobileSession) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(session.id)),
    });
    return user;
  } catch (error) {
    console.error('Failed to get user from session:', error);
    return null;
  }
}

/**
 * Check if request has valid mobile authentication
 */
export async function requireMobileAuth(request: NextRequest): Promise<MobileSession> {
  const session = await verifyMobileToken(request);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Check if request has admin role (for mobile)
 */
export async function requireMobileAdmin(request: NextRequest): Promise<MobileSession> {
  const session = await requireMobileAuth(request);
  if (session.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return session;
}

/**
 * Check if request has moderator or admin role (for mobile)
 */
export async function requireMobileModerator(request: NextRequest): Promise<MobileSession> {
  const session = await requireMobileAuth(request);
  if (session.role !== 'admin' && session.role !== 'moderator') {
    throw new Error('Forbidden');
  }
  return session;
}
