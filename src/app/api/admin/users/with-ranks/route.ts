// src/app/api/admin/users/with-ranks/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(asc(users.username));

    return NextResponse.json({
      users: allUsers.map(user => ({
        ...user,
        // Convert dates to timestamps for consistency
        createdAt: user.createdAt ? new Date(user.createdAt).getTime() : null,
        updatedAt: user.updatedAt ? new Date(user.updatedAt).getTime() : null,
        rankExpiresAt: user.rankExpiresAt ? new Date(user.rankExpiresAt).getTime() : null
      })),
      timestamp: Date.now(), // Add timestamp to ensure fresh data
      cache: 'no-cache' // Additional indicator for debugging
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        'X-Cache-Status': 'BYPASSED' // Custom header for debugging
      }
    });
  } catch (error) {
    console.error('Error fetching users with ranks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}