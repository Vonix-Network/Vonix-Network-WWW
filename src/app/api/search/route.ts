import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users, socialPosts, forumPosts, forumCategories } from '@/db/schema';
import { or, like, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const filter = searchParams.get('filter') || 'all';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${query.trim()}%`;
    const results: any[] = [];

    // Search users
    if (filter === 'all' || filter === 'users') {
      const userResults = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          minecraftUsername: users.minecraftUsername,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          or(
            like(users.username, searchTerm),
            like(users.email, searchTerm),
            like(users.minecraftUsername, searchTerm)
          )
        )
        .limit(10);

      results.push(
        ...userResults.map((user) => ({
          type: 'user',
          id: user.id,
          title: user.username,
          description: user.email || user.minecraftUsername || 'No additional info',
          link: `/profile/${user.username}`,
          timestamp: user.createdAt,
        }))
      );
    }

    // Search social posts
    if (filter === 'all' || filter === 'posts') {
      const postResults = await db
        .select({
          id: socialPosts.id,
          content: socialPosts.content,
          createdAt: socialPosts.createdAt,
          authorId: socialPosts.userId,
          authorName: users.username,
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .where(like(socialPosts.content, searchTerm))
        .limit(10);

      results.push(
        ...postResults.map((post) => ({
          type: 'post',
          id: post.id,
          title: 'Social Post',
          description: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
          link: '/social',
          timestamp: post.createdAt,
          author: post.authorName,
        }))
      );
    }

    // Search forum posts
    if (filter === 'all' || filter === 'forum') {
      const forumResults = await db
        .select({
          id: forumPosts.id,
          title: forumPosts.title,
          content: forumPosts.content,
          createdAt: forumPosts.createdAt,
          categoryId: forumPosts.categoryId,
          categorySlug: forumCategories.slug,
          authorId: forumPosts.authorId,
          authorName: users.username,
        })
        .from(forumPosts)
        .leftJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
        .leftJoin(users, eq(forumPosts.authorId, users.id))
        .where(
          or(
            like(forumPosts.title, searchTerm),
            like(forumPosts.content, searchTerm)
          )
        )
        .limit(10);

      results.push(
        ...forumResults.map((post) => ({
          type: 'forum',
          id: post.id,
          title: post.title,
          description: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
          link: `/forum/${post.categorySlug}/${post.id}`,
          timestamp: post.createdAt,
          author: post.authorName,
        }))
      );
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return NextResponse.json({ results: results.slice(0, 20) });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
