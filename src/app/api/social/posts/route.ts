import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { socialPosts, users } from '@/db/schema';
import { desc, eq, count } from 'drizzle-orm';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/social/posts - List social posts with pagination and caching
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, popular, trending
    const offset = (page - 1) * limit;

    // Always fetch fresh data - no caching
      // Build the query based on sort order
      let orderBy;
      switch (sortBy) {
        case 'popular':
          orderBy = desc(socialPosts.createdAt); // TODO: Add likes count to social posts
          break;
        case 'trending':
          orderBy = desc(socialPosts.createdAt); // TODO: Add trending algorithm
          break;
        default:
          orderBy = desc(socialPosts.createdAt);
      }

      // Get posts with author information
      const posts = await db
        .select({
          id: socialPosts.id,
          content: socialPosts.content,
          imageUrl: socialPosts.imageUrl,
          userId: socialPosts.userId,
          createdAt: socialPosts.createdAt,
          updatedAt: socialPosts.updatedAt,
          author: {
            id: users.id,
            username: users.username,
            avatar: users.avatar,
          },
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [{ total }] = await db
        .select({ total: count() })
        .from(socialPosts);

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        cache: {
          disabled: true,
          reason: 'force-dynamic rendering'
        },
      });
  } catch (error) {
    console.error('Error fetching social posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/social/posts - Create new social post (existing functionality)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting disabled - always fresh data

    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, imageUrl } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Content too long (max 5000 characters)' }, { status: 400 });
    }

    const [post] = await db
      .insert(socialPosts)
      .values({
        userId: parseInt(session.user.id),
        content: content.trim(),
        imageUrl: imageUrl || null,
      })
      .returning();

    // No cache invalidation needed - always fresh data

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
