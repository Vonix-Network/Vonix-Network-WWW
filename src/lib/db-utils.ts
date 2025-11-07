/**
 * Database Query Utilities
 * Optimized query patterns and utilities to prevent N+1 problems
 */

import { db } from '@/db';
import { 
  users, 
  donationRanks,
  forumPosts, 
  forumCategories,
  socialPosts,
  socialComments,
  forumReplies 
} from '@/db/schema';
import { eq, inArray, desc, count, and, sql } from 'drizzle-orm';
import { cache, CacheKeys } from './cache';

/**
 * Batch load users by IDs (prevents N+1 queries)
 */
export async function batchLoadUsers(userIds: number[]) {
  if (userIds.length === 0) return new Map();

  const uniqueIds = [...new Set(userIds)];
  
  const usersData = await db
    .select({
      id: users.id,
      username: users.username,
      minecraftUsername: users.minecraftUsername,
      avatar: users.avatar,
      role: users.role,
      donationRankId: users.donationRankId,
      level: users.level,
      xp: users.xp,
    })
    .from(users)
    .where(inArray(users.id, uniqueIds));

  return new Map(usersData.map(user => [user.id, user]));
}

/**
 * Batch load donation ranks by IDs
 */
export async function batchLoadDonationRanks(rankIds: (string | null)[]) {
  const validIds = rankIds.filter((id): id is string => id !== null);
  if (validIds.length === 0) return new Map();

  const uniqueIds = [...new Set(validIds)];
  
  const ranks = await db
    .select()
    .from(donationRanks)
    .where(inArray(donationRanks.id, uniqueIds));

  return new Map(ranks.map(rank => [rank.id, rank]));
}

/**
 * Optimized query for forum posts with author and category
 */
export async function getForumPostsWithRelations(options: {
  categoryId?: number;
  limit?: number;
  offset?: number;
  includeCounts?: boolean;
}) {
  const { categoryId, limit = 20, offset = 0, includeCounts = true } = options;

  // Build query
  let query = db
    .select({
      post: forumPosts,
      author: {
        id: users.id,
        username: users.username,
        minecraftUsername: users.minecraftUsername,
        avatar: users.avatar,
        role: users.role,
        donationRankId: users.donationRankId,
      },
      category: {
        id: forumCategories.id,
        name: forumCategories.name,
        slug: forumCategories.slug,
      },
    })
    .from(forumPosts)
    .leftJoin(users, eq(forumPosts.authorId, users.id))
    .leftJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .orderBy(desc(forumPosts.pinned), desc(forumPosts.createdAt))
    .limit(limit)
    .offset(offset);

  if (categoryId) {
    query = query.where(eq(forumPosts.categoryId, categoryId)) as any;
  }

  const posts = await query;

  // Optionally get reply counts in a single query
  if (includeCounts && posts.length > 0) {
    const postIds = posts.map(p => p.post.id);
    const counts = await db
      .select({
        postId: forumReplies.postId,
        count: count(),
      })
      .from(forumReplies)
      .where(inArray(forumReplies.postId, postIds))
      .groupBy(forumReplies.postId);

    const countMap = new Map(counts.map(c => [c.postId, Number(c.count)]));

    return posts.map(post => ({
      ...post,
      replyCount: countMap.get(post.post.id) || 0,
    }));
  }

  return posts;
}

/**
 * Optimized query for social posts with author
 */
export async function getSocialPostsWithRelations(options: {
  limit?: number;
  offset?: number;
  sortBy?: 'recent' | 'popular' | 'trending';
}) {
  const { limit = 20, offset = 0, sortBy = 'recent' } = options;

  let orderByClause;
  switch (sortBy) {
    case 'popular':
      orderByClause = [desc(socialPosts.likesCount), desc(socialPosts.createdAt)];
      break;
    case 'trending':
      orderByClause = [
        sql`(
          (${socialPosts.likesCount} + ${socialPosts.commentsCount} * 2) / 
          (CAST((unixepoch() - ${socialPosts.createdAt}) AS REAL) / 3600.0 + 2)
        ) DESC`
      ];
      break;
    default:
      orderByClause = [desc(socialPosts.createdAt)];
  }

  const posts = await db
    .select({
      post: socialPosts,
      author: {
        id: users.id,
        username: users.username,
        minecraftUsername: users.minecraftUsername,
        avatar: users.avatar,
        role: users.role,
        donationRankId: users.donationRankId,
        level: users.level,
      },
    })
    .from(socialPosts)
    .leftJoin(users, eq(socialPosts.userId, users.id))
    .orderBy(...orderByClause)
    .limit(limit)
    .offset(offset);

  return posts;
}

/**
 * Get user with related data (optimized single query where possible)
 */
export async function getUserWithRelations(userId: number) {
  const cacheKey = CacheKeys.user(userId);
  
  return cache.getOrSet(cacheKey, async () => {
    const [user] = await db
      .select({
        user: users,
        rank: donationRanks,
      })
      .from(users)
      .leftJoin(donationRanks, eq(users.donationRankId, donationRanks.id))
      .where(eq(users.id, userId))
      .limit(1);

    return user || null;
  }, 60); // Cache for 1 minute
}

/**
 * Optimized pagination helper with total count
 */
export async function getPaginatedQuery<T>(
  queryBuilder: any,
  countQuery: any,
  options: {
    page: number;
    limit: number;
    cacheKey?: string;
    cacheTTL?: number;
  }
) {
  const { page, limit, cacheKey, cacheTTL = 60 } = options;
  const offset = (page - 1) * limit;

  const fetchData = async () => {
    // Execute both queries in parallel
    const [data, totalResult] = await Promise.all([
      queryBuilder.limit(limit).offset(offset),
      countQuery
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  };

  if (cacheKey) {
    return cache.getOrSet(cacheKey, fetchData, cacheTTL);
  }

  return fetchData();
}

/**
 * Batch operations for bulk updates
 */
export const BatchOperations = {
  /**
   * Update multiple users in a single transaction
   */
  async updateUsers(updates: Array<{ id: number; data: Partial<typeof users.$inferInsert> }>) {
    return db.transaction(async (tx) => {
      const results = [];
      for (const { id, data } of updates) {
        const [result] = await tx
          .update(users)
          .set(data)
          .where(eq(users.id, id))
          .returning();
        results.push(result);
      }
      return results;
    });
  },

  /**
   * Batch insert (simple version without upsert due to type complexity)
   */
  async batchInsert<T extends Record<string, any>>(
    table: any,
    data: T[]
  ) {
    if (data.length === 0) return [];

    const batchSize = 100;
    const results = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchResults = await db
        .insert(table)
        .values(batch)
        .returning();
      if (Array.isArray(batchResults)) {
        results.push(...batchResults);
      }
    }

    return results;
  },
};

/**
 * Query timing wrapper for performance monitoring
 */
export async function timedQuery<T>(
  name: string,
  query: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await query();
    const duration = Date.now() - start;
    
    if (duration > 1000 && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Slow query "${name}": ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ Query "${name}" failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Common aggregation queries
 */
export const Aggregations = {
  /**
   * Get user statistics
   */
  async getUserStats(userId: number) {
    return timedQuery('getUserStats', async () => {
      const [stats] = await db
        .select({
          forumPosts: count(forumPosts.id),
          socialPosts: count(socialPosts.id),
        })
        .from(users)
        .leftJoin(forumPosts, eq(users.id, forumPosts.authorId))
        .leftJoin(socialPosts, eq(users.id, socialPosts.userId))
        .where(eq(users.id, userId))
        .groupBy(users.id);

      return stats || { forumPosts: 0, socialPosts: 0 };
    });
  },

  /**
   * Get content statistics for admin dashboard
   */
  async getContentStats() {
    return cache.getOrSet('admin:content:stats', async () => {
      const [stats] = await db
        .select({
          totalUsers: count(users.id),
          totalForumPosts: count(forumPosts.id),
          totalSocialPosts: count(socialPosts.id),
        })
        .from(users)
        .leftJoin(forumPosts, sql`1=1`) // Cross join for counts
        .leftJoin(socialPosts, sql`1=1`);

      return stats;
    }, 300); // Cache for 5 minutes
  },
};
