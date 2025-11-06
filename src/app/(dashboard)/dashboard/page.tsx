/**
 * Enterprise User Dashboard - Premium Version
 * Matching admin dashboard design system
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users, socialPosts, forumPosts, privateMessages, friendships, donationRanks, xpTransactions } from '@/db/schema';
import { eq, and, or, sql, desc, gte } from 'drizzle-orm';
import {
  Users,
  MessageSquare,
  FileText,
  Mail,
  Crown,
  Zap,
  TrendingUp,
  Activity,
  Heart,
  Trophy,
  Calendar,
  Star,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/enterprise-card';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface UserStats {
  socialPostsCount: number;
  forumPostsCount: number;
  unreadMessagesCount: number;
  friendsCount: number;
  xpLevel: number;
  xpCurrent: number;
  xpNextLevel: number;
  xpToday: number;
  donationRank: any;
  rankExpiresAt: Date | null;
  totalDonated: number;
  joinDate: Date;
}

async function getUserStats(userId: number): Promise<UserStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all user stats in parallel
  const [
    socialPostsCount,
    forumPostsCount,
    unreadMessagesCount,
    friendsCount,
    userData,
    xpToday,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(socialPosts)
      .where(eq(socialPosts.userId, userId))
      .then(r => r[0]?.count || 0),
    db.select({ count: sql<number>`count(*)` })
      .from(forumPosts)
      .where(eq(forumPosts.authorId, userId))
      .then(r => r[0]?.count || 0),
    db.select({ count: sql<number>`count(*)` })
      .from(privateMessages)
      .where(and(
        eq(privateMessages.recipientId, userId),
        eq(privateMessages.read, false)
      ))
      .then(r => r[0]?.count || 0),
    db.select({ count: sql<number>`count(*)` })
      .from(friendships)
      .where(
        and(
          or(
            eq(friendships.userId, userId),
            eq(friendships.friendId, userId)
          ),
          eq(friendships.status, 'accepted')
        )
      )
      .then(r => r[0]?.count || 0),
    db.select({
      xp: users.xp,
      level: users.level,
      donationRankId: users.donationRankId,
      rankExpiresAt: users.rankExpiresAt,
      totalDonated: users.totalDonated,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(eq(users.id, userId))
      .then(r => r[0]),
    db.select({ sum: sql<number>`coalesce(sum(${xpTransactions.amount}), 0)` })
      .from(xpTransactions)
      .where(and(
        eq(xpTransactions.userId, userId),
        gte(xpTransactions.createdAt, today)
      ))
      .then(r => r[0]?.sum || 0),
  ]);

  // Fetch donation rank if exists
  let donationRank = null;
  if (userData?.donationRankId) {
    const rank = await db.select()
      .from(donationRanks)
      .where(eq(donationRanks.id, userData.donationRankId))
      .then(r => r[0]);
    donationRank = rank;
  }

  // Calculate XP for next level (simple formula: level * 100)
  const currentLevel = userData?.level || 1;
  const currentXp = userData?.xp || 0;
  const xpForNextLevel = currentLevel * 100;
  const xpInCurrentLevel = currentXp % xpForNextLevel;

  return {
    socialPostsCount,
    forumPostsCount,
    unreadMessagesCount,
    friendsCount,
    xpLevel: currentLevel,
    xpCurrent: xpInCurrentLevel,
    xpNextLevel: xpForNextLevel,
    xpToday,
    donationRank,
    rankExpiresAt: userData?.rankExpiresAt ? new Date(typeof userData.rankExpiresAt === 'number' ? userData.rankExpiresAt * 1000 : userData.rankExpiresAt) : null,
    totalDonated: userData?.totalDonated || 0,
    joinDate: userData?.createdAt ? new Date(userData.createdAt) : new Date(),
  };
}

export default async function EnterpriseDashboardPage() {
  const session = await getServerSession();

  if (!session || !session.user || !session.user.id) {
    redirect('/login');
  }

  const stats = await getUserStats(parseInt(session.user.id));

  // Calculate XP progress percentage
  const xpProgress = Math.min((stats.xpCurrent / stats.xpNextLevel) * 100, 100);

  return (
    <div className="min-h-screen p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold gradient-text">
          Welcome back, {session.user.username}!
        </h1>
        <p className="text-muted-foreground">
          Here's your activity overview and community stats.
        </p>
      </div>

      {/* Donation Rank Banner */}
      {stats.donationRank && (
        <Card 
          variant="glass" 
          className="border-2"
          style={{
            borderColor: stats.donationRank.color + '40',
            background: `linear-gradient(135deg, ${stats.donationRank.color}10 0%, transparent 100%)`
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="p-4 rounded-xl shadow-lg"
                  style={{ backgroundColor: stats.donationRank.color + '20' }}
                >
                  <Crown className="h-8 w-8" style={{ color: stats.donationRank.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: stats.donationRank.textColor !== '#000000' ? stats.donationRank.textColor : '#ffffff' }}
                    >
                      {stats.donationRank.badge || stats.donationRank.name}
                    </span>
                    {stats.rankExpiresAt && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Expires {stats.rankExpiresAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total Donated: ${stats.totalDonated.toFixed(2)}
                  </p>
                </div>
              </div>
              <a
                href="/donations"
                className="hidden md:block px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-cyan/30 rounded-lg transition-all font-medium"
              >
                Manage Perks
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* XP Progress Card */}
      <Card variant="glass" className="border-brand-cyan/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-cyan/10 rounded-lg">
                <Zap className="h-6 w-6 text-brand-cyan" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Level {stats.xpLevel}</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.xpCurrent.toLocaleString()} / {stats.xpNextLevel.toLocaleString()} XP
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-bold text-brand-cyan">+{stats.xpToday}</p>
            </div>
          </div>
          <div className="relative h-3 bg-black/30 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-cyan to-brand-blue rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {(stats.xpNextLevel - stats.xpCurrent).toLocaleString()} XP to next level
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <a href="/social" className="block">
          <StatCard
            title="Social Posts"
            value={stats.socialPostsCount}
            icon={FileText}
            description="Your contributions"
            variant="info"
          />
        </a>

        <a href="/forum" className="block">
          <StatCard
            title="Forum Topics"
            value={stats.forumPostsCount}
            icon={MessageSquare}
            description="Discussions started"
            variant="default"
          />
        </a>

        <a href="/messages" className="block">
          <StatCard
            title="Unread Messages"
            value={stats.unreadMessagesCount}
            icon={Mail}
            description="Awaiting your reply"
            variant={stats.unreadMessagesCount > 0 ? 'warning' : 'default'}
          />
        </a>

        <a href="/friends" className="block">
          <StatCard
            title="Friends"
            value={stats.friendsCount}
            icon={Users}
            description="Your network"
            variant="success"
          />
        </a>
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Community Activity */}
        <Card variant="glass" hover>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Community Activity</CardTitle>
                <CardDescription>Your engagement stats</CardDescription>
              </div>
              <div className="p-3 bg-brand-cyan/10 rounded-lg">
                <Activity className="h-6 w-6 text-brand-cyan" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <a href="/social" className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-400" />
                  <span className="text-sm font-medium">Social Posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.socialPostsCount}</span>
                  <TrendingUp className="h-4 w-4 text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
              
              <a href="/forum" className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-brand-cyan" />
                  <span className="text-sm font-medium">Forum Topics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.forumPostsCount}</span>
                  <TrendingUp className="h-4 w-4 text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>

              <a href="/leaderboard" className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm font-medium">XP Level</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.xpLevel}</span>
                  <Star className="h-4 w-4 text-yellow-400" />
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant="glass" hover>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/social"
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-cyan/30 transition-all group text-center"
              >
                <FileText className="h-6 w-6 mx-auto mb-2 text-brand-cyan group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">New Post</p>
              </a>
              
              <a
                href="/messages"
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-warning/30 transition-all group text-center relative"
              >
                <Mail className="h-6 w-6 mx-auto mb-2 text-warning group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Messages</p>
                {stats.unreadMessagesCount > 0 && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-warning text-xs font-bold rounded-full">
                    {stats.unreadMessagesCount}
                  </span>
                )}
              </a>
              
              <a
                href="/friends"
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-success/30 transition-all group text-center"
              >
                <Users className="h-6 w-6 mx-auto mb-2 text-success group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Find Friends</p>
              </a>
              
              <a
                href="/leaderboard"
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-400/30 transition-all group text-center"
              >
                <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-400 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Leaderboard</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Since */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-lg font-semibold">{stats.joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <a
              href="/settings"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-lg transition-all font-medium"
            >
              Settings
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

