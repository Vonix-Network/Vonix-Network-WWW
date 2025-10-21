import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { users, socialPosts, forumPosts, privateMessages, registrationCodes, servers, forumReplies, socialLikes } from '@/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import { UserManagement } from '@/components/admin/user-management';
import { RecentActivity } from '@/components/admin/recent-activity';
import { QuickActions } from '@/components/admin/quick-actions';
import { ServerStatusDisplay } from '@/components/admin/server-status-display';
import { AdminNavigation } from '@/components/admin/admin-navigation';
import BackgroundSelector from '@/components/admin/BackgroundSelector';
import { Shield, Users, MessageSquare, FileText, Key, Server } from 'lucide-react';
import { cachedExternalFetch } from '@/lib/connection-warmup';

export const revalidate = 0; // No caching - always fresh data
export const dynamic = 'force-dynamic'; // Keep dynamic for real-time data

async function AdminContent() {
  await requireAdmin();

  // Get statistics
  const [stats] = await db
    .select({
      totalUsers: sql<number>`count(distinct ${users.id})`,
      totalPosts: sql<number>`count(distinct ${socialPosts.id})`,
      totalForumPosts: sql<number>`count(distinct ${forumPosts.id})`,
      totalMessages: sql<number>`count(distinct ${privateMessages.id})`,
    })
    .from(users)
    .leftJoin(socialPosts, sql`true`)
    .leftJoin(forumPosts, sql`true`)
    .leftJoin(privateMessages, sql`true`);

  // Get recent users
  const recentUsersRaw = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      minecraftUsername: users.minecraftUsername,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(10);

  // Convert Date to Unix timestamp
  const recentUsers = recentUsersRaw.map(user => ({
    ...user,
    createdAt: Math.floor(user.createdAt.getTime() / 1000),
  }));

  // Get active registration codes
  const activeCodesCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(registrationCodes)
    .where(eq(registrationCodes.used, false));

  // Get servers (database data only - no external API calls here)
  const serversRaw = await db
    .select()
    .from(servers)
    .orderBy(servers.orderIndex, desc(servers.createdAt));

  // Prepare servers for client-side status checking
  const serverListForClient = serversRaw.map(server => ({
    ...server,
    status: 'loading' as const, // Will be updated by client component
    playersOnline: 0,
    playersMax: 0,
    version: null, // Initialize as null, will be updated by client
  }));

  // Get recent activity
  const recentActivity = [];

  // Recent user registrations
  const recentUsersActivity = recentUsersRaw.slice(0, 3).map(user => ({
    type: 'user_registered',
    text: `${user.username} registered`,
    time: user.createdAt,
    username: user.username,
  }));
  recentActivity.push(...recentUsersActivity);

  // Recent forum posts
  const recentForumPostsRaw = await db
    .select({
      id: forumPosts.id,
      title: forumPosts.title,
      createdAt: forumPosts.createdAt,
      author: {
        username: users.username,
      },
    })
    .from(forumPosts)
    .leftJoin(users, eq(forumPosts.authorId, users.id))
    .orderBy(desc(forumPosts.createdAt))
    .limit(3);

  const forumActivity = recentForumPostsRaw.map(post => ({
    type: 'forum_post',
    text: `${post.author?.username || 'Someone'} created "${post.title}"`,
    time: post.createdAt,
    username: post.author?.username,
  }));
  recentActivity.push(...forumActivity);

  // Recent social posts
  const recentSocialPostsRaw = await db
    .select({
      id: socialPosts.id,
      content: socialPosts.content,
      createdAt: socialPosts.createdAt,
      author: {
        username: users.username,
      },
    })
    .from(socialPosts)
    .leftJoin(users, eq(socialPosts.userId, users.id))
    .orderBy(desc(socialPosts.createdAt))
    .limit(3);

  const socialActivity = recentSocialPostsRaw.map(post => ({
    type: 'social_post',
    text: `${post.author?.username || 'Someone'} created a post`,
    time: post.createdAt,
    username: post.author?.username,
  }));
  recentActivity.push(...socialActivity);

  // Sort all activity by time and take top 10
  const sortedActivity = recentActivity
    .sort((a, b) => {
      const timeA = a.time instanceof Date ? a.time.getTime() : a.time;
      const timeB = b.time instanceof Date ? b.time.getTime() : b.time;
      return timeB - timeA;
    })
    .slice(0, 10);

  return (
    <div className="w-full space-y-6 fade-in-up">
      {/* Header */}
      <div className="glass border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-400" />
              <span className="gradient-text">Admin</span> Dashboard
            </h1>
            <p className="text-gray-400">Manage users, content, and system settings</p>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <Shield className="h-5 w-5 text-red-400" />
              <span className="text-red-400 font-semibold">Administrator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={Number(stats.totalUsers)}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Social Posts"
          value={Number(stats.totalPosts)}
          icon={<FileText className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Forum Topics"
          value={Number(stats.totalForumPosts)}
          icon={<MessageSquare className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Active Codes"
          value={Number(activeCodesCount[0].count)}
          icon={<Key className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Admin Navigation */}
      <AdminNavigation />

      {/* Quick Actions */}
      <QuickActions />

      {/* Server Management - Now loads fast, status updates asynchronously */}
      <ServerStatusDisplay servers={serverListForClient} />

      {/* Background Settings */}
      <BackgroundSelector />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Management */}
        <div className="lg:col-span-2">
          <UserManagement users={recentUsers} />
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivity activities={sortedActivity} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  };

  return (
    <div className="glass border border-white/10 rounded-2xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
      <p className="text-4xl font-bold text-white">{value.toLocaleString()}</p>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-8 fade-in-up">
      {/* Header Skeleton */}
      <div className="glass border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-48 bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-6 w-64 bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Admin Navigation Skeleton */}
      <div className="h-16 w-full bg-gray-700 rounded animate-pulse" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
              <div className="w-10 h-10 bg-gray-700 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-16 bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div>
        <div className="h-8 w-32 bg-gray-700 rounded animate-pulse mb-4" />
        <div className="h-32 w-full bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Management Skeleton */}
        <div className="lg:col-span-2">
          <div className="h-8 w-40 bg-gray-700 rounded animate-pulse mb-4" />
          <div className="h-64 w-full bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Recent Activity Skeleton */}
        <div>
          <div className="h-8 w-36 bg-gray-700 rounded animate-pulse mb-4" />
          <div className="h-64 w-full bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminContent />
    </Suspense>
  );
}
