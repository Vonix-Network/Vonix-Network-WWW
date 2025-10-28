import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { forumPosts, forumCategories, users } from '@/db/schema';
import { handleError } from '@/lib/error-handler';
import { desc, eq, count } from 'drizzle-orm';
import { awardXP, XP_REWARDS, checkAchievements } from '@/lib/xp-system';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/forum/posts - List forum posts with pagination and caching
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const categoryId = searchParams.get('categoryId');
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, popular, pinned
    const offset = (page - 1) * limit;

    // Always fetch fresh data - no caching
      // Build the query based on sort order
      let orderByClause;
      switch (sortBy) {
        case 'popular':
          orderByClause = [desc(forumPosts.views)];
          break;
        case 'pinned':
          orderByClause = [desc(forumPosts.pinned), desc(forumPosts.createdAt)];
          break;
        default:
          orderByClause = [desc(forumPosts.createdAt)];
      }

      // Build where clause
      let whereClause = undefined;
      if (categoryId) {
        whereClause = eq(forumPosts.categoryId, parseInt(categoryId));
      }

      // Get posts with author and category information
      const posts = await db
        .select({
          id: forumPosts.id,
          title: forumPosts.title,
          content: forumPosts.content,
          categoryId: forumPosts.categoryId,
          authorId: forumPosts.authorId,
          pinned: forumPosts.pinned,
          locked: forumPosts.locked,
          views: forumPosts.views,
          createdAt: forumPosts.createdAt,
          updatedAt: forumPosts.updatedAt,
          author: {
            id: users.id,
            username: users.username,
            avatar: users.avatar,
          },
          category: {
            id: forumCategories.id,
            name: forumCategories.name,
          },
        })
        .from(forumPosts)
        .leftJoin(users, eq(forumPosts.authorId, users.id))
        .leftJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
        .where(whereClause)
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [{ total }] = await db
        .select({ total: count() })
        .from(forumPosts)
        .where(whereClause);

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
    return handleError(error, 'Get forum posts');
  }
}

// POST /api/forum/posts - Create new forum post
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await import('@/lib/rate-limit').then(m => m.apiRateLimit(request));
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: 'Too many requests', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      );
    }

    // Authentication
    const session = await import('@/lib/auth').then(m => m.getServerSession());
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Debug logging
    console.log('Request body:', body);
    console.log('Session user:', session.user);
    
    const { createForumPostSchema } = await import('@/lib/validation');
    const validationResult = createForumPostSchema.safeParse(body);

    if (!validationResult.success) {
      console.log('Validation errors:', validationResult.error.issues);
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { categoryId, title, content } = validationResult.data;

    // Create post with optimized query
    const [post] = await db
      .insert(forumPosts)
      .values({
        categoryId,
        title: title.trim(),
        content: content.trim(),
        authorId: parseInt(session.user.id),
        pinned: false,
        locked: false,
        views: 0,
      })
      .returning();

    // No cache invalidation needed - always fresh data

    // Update user engagement (non-blocking)
    import('@/lib/engagement').then(m => m.updateEngagement(parseInt(session.user.id), 'FORUM_POST')).catch(console.error);

    // Award XP for creating forum post
    const userId = parseInt(session.user.id);
    try {
      await awardXP(
        userId,
        XP_REWARDS.FORUM_POST_CREATE,
        'forum_post_create',
        post.id,
        'Created a forum post'
      );

      // Check achievements
      const postCount = await db
        .select({ count: count() })
        .from(forumPosts)
        .where(eq(forumPosts.authorId, userId));
      
      await checkAchievements(userId, 'forum', Number(postCount[0]?.count || 0));
    } catch (xpError) {
      console.error('Error awarding XP for forum post:', xpError);
    }

    return NextResponse.json({
      post,
      success: true,
    }, { status: 201 });
  } catch (error) {
    return handleError(error, 'Create forum post');
  }
}
