import { NextResponse } from 'next/server';
import { API } from '@/lib/api-middleware';
import { cache, CacheKeys, cachedQuery } from '@/lib/cache';
import { batchLoadDonationRanks, timedQuery } from '@/lib/db-utils';
import { db } from '@/db';
import { users, userEngagement } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// OPTIMIZED: Uses API middleware, smart caching, and batch loading
export const GET = API.public(async (request) => {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  // Cache for 5 minutes - leaderboard doesn't change that frequently
  const cacheKey = CacheKeys.leaderboard(limit);
  
  const leaderboard = await cachedQuery(
    cacheKey,
    async () => {
      return timedQuery('getLeaderboard', async () => {
        // Step 1: Get leaderboard data
        const data = await db
          .select({
            userId: userEngagement.userId,
            username: users.username,
            minecraftUsername: users.minecraftUsername,
            avatar: users.avatar,
            donationRankId: users.donationRankId,
            level: users.level,
            xp: users.xp,
            totalPoints: userEngagement.totalPoints,
            postsCreated: userEngagement.postsCreated,
            commentsCreated: userEngagement.commentsCreated,
            forumPostsCreated: userEngagement.forumPostsCreated,
            forumRepliesCreated: userEngagement.forumRepliesCreated,
            upvotesReceived: userEngagement.upvotesReceived,
            downvotesReceived: userEngagement.downvotesReceived,
            likesReceived: userEngagement.likesReceived,
          })
          .from(userEngagement)
          .leftJoin(users, eq(userEngagement.userId, users.id))
          .orderBy(desc(userEngagement.totalPoints))
          .limit(limit);

        // Step 2: Batch load donation ranks (prevents N+1 queries)
        const rankIds = data
          .map(d => d.donationRankId)
          .filter((id): id is string => id !== null);
        
        const ranksMap = await batchLoadDonationRanks(rankIds);

        // Step 3: Attach ranks and add rank numbers
        return data.map((entry, index) => ({
          rank: index + 1,
          ...entry,
          donationRank: entry.donationRankId ? ranksMap.get(entry.donationRankId) || null : null,
        }));
      });
    },
    300 // 5 minute TTL
  );

  return NextResponse.json(leaderboard);
});
