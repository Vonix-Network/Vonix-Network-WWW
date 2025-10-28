import { Suspense } from 'react';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Zap, Crown, Medal } from 'lucide-react';
import { getTitleForLevel, getColorForLevel } from '@/lib/xp-utils';

// Helper function to get user avatar (Minecraft head or fallback)
function getUserAvatar(minecraftUsername?: string | null, avatar?: string | null, size: number = 64): string {
  if (minecraftUsername) {
    return `https://mc-heads.net/head/${minecraftUsername}/${size}`;
  }
  if (avatar) {
    return avatar;
  }
  return `https://mc-heads.net/head/steve/${size}`;
}

// Inline XP Badge component for server-side rendering
function LevelBadge({ level, levelColor, size = 'md' }: { level: number; levelColor: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${levelColor}20`,
        color: levelColor,
        border: `1.5px solid ${levelColor}60`,
      }}
    >
      <Zap className={`${iconSizes[size]} fill-current`} />
      <span>Lv. {level}</span>
    </div>
  );
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function XPLeaderboardContent() {
  // Get top 100 users by XP
  const leaderboard = await db
    .select({
      id: users.id,
      username: users.username,
      minecraftUsername: users.minecraftUsername,
      avatar: users.avatar,
      xp: users.xp,
      level: users.level,
      title: users.title,
      role: users.role,
      donationRankId: users.donationRankId,
    })
    .from(users)
    .orderBy(desc(users.xp))
    .limit(100);

  // Get donation ranks for badge display
  const ranks = await db.select().from(donationRanks);
  const rankMap = new Map(ranks.map(r => [r.id, r]));

  // Enhance with colors and titles
  const enhancedLeaderboard = leaderboard.map((user, index) => ({
    ...user,
    rank: index + 1,
    title: user.title || getTitleForLevel(user.level),
    levelColor: getColorForLevel(user.level),
    donationRank: user.donationRankId && rankMap.has(user.donationRankId) ? rankMap.get(user.donationRankId) : null,
  }));

  // Separate top 3 for podium
  const top3 = enhancedLeaderboard.slice(0, 3);
  const remaining = enhancedLeaderboard.slice(3);

  // Rearrange top 3 for podium display (2nd, 1st, 3rd)
  const podium = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="fade-in-up">
          <div className="inline-block mb-4 px-4 py-2 glass rounded-full border border-yellow-500/20">
            <span className="text-sm text-yellow-400 font-medium">🏆 XP Rankings</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text-animated">Leaderboard</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Top players ranked by experience points and level achievements
          </p>
        </div>
      </section>

      {/* Podium - Top 3 */}
      {top3.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="glass border border-yellow-500/20 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-yellow-400" />
              Top Champions
            </h2>
            
            <div className="grid grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
              {podium.map((user, index) => {
                const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3;
                const heights = {
                  1: 'min-h-[280px]',
                  2: 'min-h-[220px]',
                  3: 'min-h-[180px]',
                };
                const scales = {
                  1: 'scale-105',
                  2: 'scale-100',
                  3: 'scale-95',
                };
                const medalColors = {
                  1: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/5',
                  2: 'text-gray-400 border-gray-500/40 bg-gray-500/5',
                  3: 'text-orange-400 border-orange-500/40 bg-orange-500/5',
                };
                
                return (
                  <div
                    key={user.id}
                    className={`${index === 1 ? 'order-2' : index === 0 ? 'order-1' : 'order-3'}`}
                  >
                    <div className={`glass border-2 ${medalColors[actualRank as keyof typeof medalColors]} rounded-2xl p-4 ${heights[actualRank as keyof typeof heights]} ${scales[actualRank as keyof typeof scales]} flex flex-col items-center justify-between hover-lift relative transition-all duration-200`}>
                      {/* Rank Badge */}
                      <div className={`absolute -top-4 ${medalColors[actualRank as keyof typeof medalColors]}`}>
                        {actualRank === 1 && <Crown className="h-8 w-8" />}
                        {actualRank === 2 && <Medal className="h-7 w-7" />}
                        {actualRank === 3 && <Medal className="h-6 w-6" />}
                      </div>

                      {/* Top Section */}
                      <div className="flex flex-col items-center pt-6">
                        {/* Avatar */}
                        <div className="relative mb-3">
                          <img
                            src={getUserAvatar(user.minecraftUsername, user.avatar, actualRank === 1 ? 128 : 96)}
                            alt={user.username}
                            className={`${actualRank === 1 ? 'w-24 h-24' : 'w-20 h-20'} rounded-lg border-4 pixelated`}
                            style={{ borderColor: user.levelColor }}
                          />
                        </div>

                        {/* User Info */}
                        <h3 
                          className={`${actualRank === 1 ? 'text-xl' : 'text-lg'} font-bold mb-1`}
                          style={{
                            color: user.donationRank
                              ? (user.donationRank.textColor !== '#000000' && user.donationRank.textColor !== '#000'
                                ? user.donationRank.textColor
                                : '#ffffff')
                              : '#ffffff'
                          }}
                        >
                          {user.username}
                        </h3>
                        {user.donationRank && (
                          <div 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold mb-1"
                            style={{
                              backgroundColor: user.donationRank.color + '20',
                              color: (user.donationRank.textColor !== '#000000' && user.donationRank.textColor !== '#000') ? user.donationRank.textColor : '#ffffff',
                              border: `1px solid ${user.donationRank.color}60`,
                            }}
                          >
                            <Crown className="h-3 w-3" />
                            {user.donationRank.badge || user.donationRank.name}
                          </div>
                        )}
                        <p className="text-sm text-gray-400 mb-2">{user.title}</p>
                      </div>

                      {/* Bottom Section */}
                      <div className="flex flex-col items-center gap-2 pb-2">
                        {/* Level Badge */}
                        <LevelBadge
                          level={user.level}
                          levelColor={user.levelColor}
                          size={actualRank === 1 ? 'lg' : 'md'}
                        />

                        {/* XP */}
                        <div className="text-center">
                          <div className={`${actualRank === 1 ? 'text-3xl' : 'text-2xl'} font-bold`} style={{ color: user.levelColor }}>
                            {user.xp.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Total XP</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Rest of Leaderboard */}
      <section className="container mx-auto px-4 py-10">
        <div className="glass border border-purple-500/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold">
              <span className="gradient-text">Rankings</span>
            </h2>
          </div>

          <div className="divide-y divide-white/10">
            {remaining.map((user) => (
              <div
                key={user.id}
                className="p-6 hover:bg-white/5 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Rank */}
                  <div className="w-12 text-center">
                    <span className="text-2xl font-bold text-gray-400">
                      #{user.rank}
                    </span>
                  </div>

                  {/* Avatar */}
                  <img
                    src={getUserAvatar(user.minecraftUsername, user.avatar, 64)}
                    alt={user.username}
                    className="w-14 h-14 rounded-lg border-2 pixelated"
                    style={{ borderColor: user.levelColor }}
                  />

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 
                        className="text-lg font-bold"
                        style={{
                          color: user.donationRank
                            ? (user.donationRank.textColor !== '#000000' && user.donationRank.textColor !== '#000'
                              ? user.donationRank.textColor
                              : '#ffffff')
                            : '#ffffff'
                        }}
                      >
                        {user.username}
                      </h3>
                      {user.donationRank && (
                        <span 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: user.donationRank.color + '20',
                            color: (user.donationRank.textColor !== '#000000' && user.donationRank.textColor !== '#000') ? user.donationRank.textColor : '#ffffff',
                            border: `1px solid ${user.donationRank.color}60`,
                          }}
                        >
                          <Crown className="h-3 w-3" />
                          {user.donationRank.badge || user.donationRank.name}
                        </span>
                      )}
                      <LevelBadge
                        level={user.level}
                        levelColor={user.levelColor}
                        size="sm"
                      />
                    </div>
                    <p className="text-sm text-gray-400">{user.title}</p>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: user.levelColor }}>
                      {user.xp.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Total XP</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="container mx-auto px-4 py-10">
        <div className="glass border border-blue-500/20 rounded-2xl p-6 bg-blue-500/5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            How to Earn XP
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Create Post:</span>
              <span className="text-green-400 font-semibold ml-2">+15 XP</span>
            </div>
            <div>
              <span className="text-gray-400">Write Comment:</span>
              <span className="text-green-400 font-semibold ml-2">+5 XP</span>
            </div>
            <div>
              <span className="text-gray-400">Forum Post:</span>
              <span className="text-green-400 font-semibold ml-2">+20 XP</span>
            </div>
            <div>
              <span className="text-gray-400">Daily Login:</span>
              <span className="text-green-400 font-semibold ml-2">+5 XP</span>
            </div>
            <div>
              <span className="text-gray-400">Get Post Like:</span>
              <span className="text-green-400 font-semibold ml-2">+2 XP</span>
            </div>
            <div>
              <span className="text-gray-400">Forum Reply:</span>
              <span className="text-green-400 font-semibold ml-2">+10 XP</span>
            </div>
            <div>
              <span className="text-gray-400">Friend Accepted:</span>
              <span className="text-green-400 font-semibold ml-2">+10 XP</span>
            </div>
            <div>
              <span className="text-gray-400">Streak Bonus:</span>
              <span className="text-green-400 font-semibold ml-2">+2-50 XP</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="h-12 w-64 bg-gray-700 rounded-full animate-pulse mx-auto mb-6" />
        <div className="h-16 w-96 bg-gray-700 rounded animate-pulse mx-auto" />
      </section>
      <section className="container mx-auto px-4 py-10">
        <div className="glass border border-purple-500/20 rounded-2xl p-8">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4">
              <div className="w-12 h-8 bg-gray-700 rounded animate-pulse" />
              <div className="w-14 h-14 bg-gray-700 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-32 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <XPLeaderboardContent />
    </Suspense>
  );
}

