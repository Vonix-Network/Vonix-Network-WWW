import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { sql, like, or, eq, and, desc, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/admin/users - List users with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where conditions
    const conditions = [];
    
    // Search across username, email, and minecraft username
    if (search) {
      conditions.push(
        or(
          like(users.username, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.minecraftUsername, `%${search}%`)
        )
      );
    }

    // Filter by role
    if (roleFilter && ['user', 'moderator', 'admin'].includes(roleFilter)) {
      conditions.push(eq(users.role, roleFilter as 'user' | 'moderator' | 'admin'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);

    // Determine sort column and order
    const orderColumn = sortBy === 'username' ? users.username :
                       sortBy === 'email' ? users.email :
                       sortBy === 'role' ? users.role :
                       users.createdAt;
    
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Get paginated users
    const usersList = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        minecraftUsername: users.minecraftUsername,
        avatar: users.avatar,
        role: users.role,
        level: users.level,
        xp: users.xp,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(orderFn(orderColumn))
      .limit(limit)
      .offset((page - 1) * limit);

    // Add stats for each user (simplified to avoid complex subqueries)
    const usersWithStats = usersList.map(user => ({
      ...user,
      stats: {
        socialPosts: 0,
        forumPosts: 0,
        forumReplies: 0,
      },
    }));

    return NextResponse.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
