import { Suspense } from 'react';
import { db } from '@/db';
import { users, userEngagement, donationRanks } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { Trophy, TrendingUp, Award, Star, Medal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getUserAvatarWithSize } from '@/lib/utils/avatar';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function LeaderboardContent() {
  // Get ALL users with their engagement (including 0 points)
  const leaderboard = await db
    .select({
      userId: users.id,
      username: users.username,
      minecraftUsername: users.minecraftUsername,
      avatar: users.avatar,
      donationRankId: users.donationRankId,
      totalPoints: sql<number>`COALESCE(${userEngagement.totalPoints}, 0)`,
      postsCreated: sql<number>`COALESCE(${userEngagement.postsCreated}, 0)`,
      commentsCreated: sql<number>`COALESCE(${userEngagement.commentsCreated}, 0)`,
      forumPostsCreated: sql<number>`COALESCE(${userEngagement.forumPostsCreated}, 0)`,
      forumRepliesCreated: sql<number>`COALESCE(${userEngagement.forumRepliesCreated}, 0)`,
      upvotesReceived: sql<number>`COALESCE(${userEngagement.upvotesReceived}, 0)`,
      likesReceived: sql<number>`COALESCE(${userEngagement.likesReceived}, 0)`,
    })
    .from(users)
    .leftJoin(userEngagement, eq(users.id, userEngagement.userId))
    .orderBy(desc(sql<number>`COALESCE(${userEngagement.totalPoints}, 0)`))
    .limit(100);

  // Separate top 3 for pedestal
  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  // Get donation ranks for badge display
  const ranks = await db.select().from(donationRanks);
  const rankMap = new Map(ranks.map(r => [r.id, r]));

  return (
    <div className="max-w-7xl mx-auto fade-in-up">
      {/* Header */}
      <div className="glass border border-green-500/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <span className="gradient-text">Leaderboard</span>
            </h1>
            <p className="text-gray-400">Top community members by engagement</p>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">Live Rankings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="glass border border-blue-500/20 rounded-2xl p-6 mb-6 bg-blue-500/5">
        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
          <Star className="h-5 w-5 text-blue-400" />
          How Points Are Earned
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Social Post:</span>
            <span className="text-green-400 font-semibold ml-2">+5 pts</span>
          </div>
          <div>
            <span className="text-gray-400">Comment:</span>
            <span className="text-green-400 font-semibold ml-2">+3 pts</span>
          </div>
          <div>
            <span className="text-gray-400">Forum Post:</span>
            <span className="text-green-400 font-semibold ml-2">+10 pts</span>
          </div>
          <div>
            <span className="text-gray-400">Forum Reply:</span>
            <span className="text-green-400 font-semibold ml-2">+5 pts</span>
          </div>
          <div>
            <span className="text-gray-400">Upvote Received:</span>
            <span className="text-green-400 font-semibold ml-2">+2 pts</span>
          </div>
          <div>
            <span className="text-gray-400">Like Received:</span>
            <span className="text-green-400 font-semibold ml-2">+1 pt</span>
          </div>
          <div>
            <span className="text-gray-400">Downvote Received:</span>
            <span className="text-red-400 font-semibold ml-2">-1 pt</span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="glass border border-yellow-500/20 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
            <Medal className="h-6 w-6 text-yellow-400" />
            <span className="gradient-text">Top Champions</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="glass border border-gray-400/20 rounded-2xl p-6 text-center hover-lift order-2 md:order-1">
                <div className="relative inline-block mb-4">
                  <img
                    src={getUserAvatarWithSize(top3[1].minecraftUsername, top3[1].avatar, 128, top3[1].username)}
                    alt={top3[1].username || 'User'}
                    className="w-24 h-24 rounded-full border-4 border-gray-400"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    2
                  </div>
                </div>
                <Link href={`/profile/${top3[1].username}`} className="hover:text-green-400 transition-colors">
                  <h3 className="font-bold text-xl text-white mb-1">{top3[1].username}</h3>
                </Link>
                <p className="text-3xl font-bold text-gray-400 mb-2">{top3[1].totalPoints?.toLocaleString()}</p>
                <p className="text-sm text-gray-500">points</p>
                {top3[1].donationRankId && rankMap.has(top3[1].donationRankId) && (
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2" style={{
                    backgroundColor: rankMap.get(top3[1].donationRankId)!.color + '20',
                    color: (rankMap.get(top3[1].donationRankId)!.textColor && rankMap.get(top3[1].donationRankId)!.textColor !== '#000000' && rankMap.get(top3[1].donationRankId)!.textColor !== '#000') ? rankMap.get(top3[1].donationRankId)!.textColor : '#ffffff',
                    border: `1px solid ${rankMap.get(top3[1].donationRankId)!.color}40`,
                  }}>
                    {rankMap.get(top3[1].donationRankId)!.badge || rankMap.get(top3[1].donationRankId)!.name}
                  </div>
                )}
              </div>
            )}

            {/* 1st Place */}
            <div className="glass border border-yellow-400/30 rounded-2xl p-6 text-center hover-lift glow-yellow order-1 md:order-2 md:scale-105">
              <div className="relative inline-block mb-4">
                <img
                  src={getUserAvatarWithSize(top3[0].minecraftUsername, top3[0].avatar, 128, top3[0].username)}
                  alt={top3[0].username || 'User'}
                  className="w-28 h-28 rounded-full border-4 border-yellow-400"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  1
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
              </div>
              <Link href={`/profile/${top3[0].username}`} className="hover:text-green-400 transition-colors">
                <h3 className="font-bold text-2xl text-white mb-1">{top3[0].username}</h3>
              </Link>
              <p className="text-4xl font-bold text-yellow-400 mb-2">{top3[0].totalPoints?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">points</p>
              {top3[0].donationRankId && rankMap.has(top3[0].donationRankId) && (
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2" style={{
                  backgroundColor: rankMap.get(top3[0].donationRankId)!.color + '20',
                  color: (rankMap.get(top3[0].donationRankId)!.textColor && rankMap.get(top3[0].donationRankId)!.textColor !== '#000000' && rankMap.get(top3[0].donationRankId)!.textColor !== '#000') ? rankMap.get(top3[0].donationRankId)!.textColor : '#ffffff',
                  border: `1px solid ${rankMap.get(top3[0].donationRankId)!.color}40`,
                }}>
                  {rankMap.get(top3[0].donationRankId)!.badge || rankMap.get(top3[0].donationRankId)!.name}
                </div>
              )}
            </div>

            {/* 3rd Place */}
            {top3[2] && (
              <div className="glass border border-orange-400/20 rounded-2xl p-6 text-center hover-lift order-3">
                <div className="relative inline-block mb-4">
                  <img
                    src={getUserAvatarWithSize(top3[2].minecraftUsername, top3[2].avatar, 128, top3[2].username)}
                    alt={top3[2].username || 'User'}
                    className="w-24 h-24 rounded-full border-4 border-orange-400"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    3
                  </div>
                </div>
                <Link href={`/profile/${top3[2].username}`} className="hover:text-green-400 transition-colors">
                  <h3 className="font-bold text-xl text-white mb-1">{top3[2].username}</h3>
                </Link>
                <p className="text-3xl font-bold text-orange-400 mb-2">{top3[2].totalPoints?.toLocaleString()}</p>
                <p className="text-sm text-gray-500">points</p>
                {top3[2].donationRankId && rankMap.has(top3[2].donationRankId) && (
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2" style={{
                    backgroundColor: rankMap.get(top3[2].donationRankId)!.color + '20',
                    color: (rankMap.get(top3[2].donationRankId)!.textColor && rankMap.get(top3[2].donationRankId)!.textColor !== '#000000' && rankMap.get(top3[2].donationRankId)!.textColor !== '#000') ? rankMap.get(top3[2].donationRankId)!.textColor : '#ffffff',
                    border: `1px solid ${rankMap.get(top3[2].donationRankId)!.color}40`,
                  }}>
                    {rankMap.get(top3[2].donationRankId)!.badge || rankMap.get(top3[2].donationRankId)!.name}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="glass border border-green-500/20 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold">
            <span className="gradient-text">Full Rankings</span>
          </h2>
        </div>

        <div className="divide-y divide-white/10">
          {leaderboard.map((user, index) => (
            <div
              key={user.userId}
              className="p-4 hover:bg-white/5 transition-colors flex items-center gap-4"
            >
              {/* Rank */}
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                index === 1 ? 'bg-gray-400/20 text-gray-400' :
                index === 2 ? 'bg-orange-400/20 text-orange-400' :
                'bg-slate-800 text-gray-400'
              }`}>
                #{index + 1}
              </div>

              {/* Avatar */}
              <img
                src={getUserAvatarWithSize(user.minecraftUsername, user.avatar, 64, user.username)}
                alt={user.username || 'User'}
                className="w-12 h-12 rounded-full border-2 border-green-500/30"
              />

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${user.username}`}
                    className="font-semibold hover:text-green-400 transition-colors"
                    style={{
                      color: user.donationRankId && rankMap.has(user.donationRankId)
                        ? (rankMap.get(user.donationRankId)!.textColor !== '#000000' && rankMap.get(user.donationRankId)!.textColor !== '#000'
                          ? rankMap.get(user.donationRankId)!.textColor
                          : '#ffffff')
                        : '#ffffff'
                    }}
                  >
                    {user.username}
                  </Link>
                  {user.donationRankId && rankMap.has(user.donationRankId) && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{
                      backgroundColor: rankMap.get(user.donationRankId)!.color + '20',
                      color: (rankMap.get(user.donationRankId)!.textColor && rankMap.get(user.donationRankId)!.textColor !== '#000000' && rankMap.get(user.donationRankId)!.textColor !== '#000') ? rankMap.get(user.donationRankId)!.textColor : '#ffffff',
                      border: `1px solid ${rankMap.get(user.donationRankId)!.color}40`,
                    }}>
                      {rankMap.get(user.donationRankId)!.badge || rankMap.get(user.donationRankId)!.name}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 flex gap-4 mt-1">
                  <span>{user.forumPostsCreated} forum posts</span>
                  <span>{user.postsCreated} social posts</span>
                  <span>{user.upvotesReceived} upvotes</span>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {user.totalPoints?.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto fade-in-up">
      {/* Header Skeleton */}
      <div className="glass border border-green-500/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-10 w-48 bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-6 w-64 bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="hidden md:block">
            <div className="h-8 w-32 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Info Card Skeleton */}
      <div className="glass border border-blue-500/20 rounded-2xl p-6 mb-6 bg-blue-500/5">
        <div className="h-6 w-40 bg-gray-700 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Skeleton */}
      <div className="glass border border-yellow-500/20 rounded-2xl p-8 mb-6">
        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mx-auto mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass border border-gray-500/20 rounded-2xl p-6 text-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 animate-pulse" />
              <div className="h-6 w-20 bg-gray-700 rounded animate-pulse mx-auto mb-2" />
              <div className="h-8 w-16 bg-gray-700 rounded animate-pulse mx-auto mb-2" />
              <div className="h-4 w-12 bg-gray-700 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Full Leaderboard Skeleton */}
      <div className="glass border border-green-500/20 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="h-8 w-32 bg-gray-700 rounded animate-pulse" />
        </div>

        <div className="divide-y divide-white/10">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse" />
              <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="w-20 h-8 bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <LeaderboardContent />
    </Suspense>
  );
}
