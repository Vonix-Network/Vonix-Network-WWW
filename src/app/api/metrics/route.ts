/**
 * Metrics endpoint for monitoring and observability
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, forumPosts, socialPosts, donations } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication for metrics
    await requireAdmin();

    const [
      userCount,
      postCount,
      socialPostCount,
      donationCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(forumPosts),
      db.select({ count: sql<number>`count(*)` }).from(socialPosts),
      db.select({ count: sql<number>`count(*)` }).from(donations),
    ]);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      metrics: {
        users: {
          total: userCount[0].count,
        },
        forum: {
          posts: postCount[0].count,
        },
        social: {
          posts: socialPostCount[0].count,
        },
        donations: {
          total: donationCount[0].count,
        },
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
