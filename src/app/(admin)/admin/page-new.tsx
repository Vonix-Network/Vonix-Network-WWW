import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { users, socialPosts, forumPosts, privateMessages, registrationCodes, servers } from '@/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { RecentActivity } from '@/components/admin/recent-activity';
import { QuickActions } from '@/components/admin/quick-actions';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  FileText, 
  MessageSquare, 
  Key, 
  Server as ServerIcon,
  TrendingUp,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function AdminDashboardContent() {
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

  // Get active registration codes
  const activeCodesCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(registrationCodes)
    .where(eq(registrationCodes.used, false));

  // Get server count
  const serverCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(servers);

  // Get recent users for activity
  const recentUsersRaw = await db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(5);

  // Get recent forum posts
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
    .limit(5);

  // Get recent social posts
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
    .limit(5);

  // Combine activity
  const recentActivity = [
    ...recentUsersRaw.map(user => ({
      type: 'user_registered' as const,
      text: `${user.username} registered`,
      time: user.createdAt,
      username: user.username,
    })),
    ...recentForumPostsRaw.map(post => ({
      type: 'forum_post' as const,
      text: `${post.author?.username || 'Someone'} created "${post.title}"`,
      time: post.createdAt,
      username: post.author?.username,
    })),
    ...recentSocialPostsRaw.map(post => ({
      type: 'social_post' as const,
      text: `${post.author?.username || 'Someone'} created a post`,
      time: post.createdAt,
      username: post.author?.username,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your Vonix Network administration"
        icon={LayoutDashboard}
      />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/users">
          <AdminStatCard
            title="Total Users"
            value={Number(stats.totalUsers)}
            icon={UsersIcon}
            color="blue"
            subtitle="Registered accounts"
          />
        </Link>

        <Link href="/moderation/social">
          <AdminStatCard
            title="Social Posts"
            value={Number(stats.totalPosts)}
            icon={FileText}
            color="green"
            subtitle="Community posts"
          />
        </Link>

        <Link href="/moderation/forum">
          <AdminStatCard
            title="Forum Topics"
            value={Number(stats.totalForumPosts)}
            icon={MessageSquare}
            color="purple"
            subtitle="Discussion threads"
          />
        </Link>

        <Link href="/admin/api-keys">
          <AdminStatCard
            title="Active Codes"
            value={Number(activeCodesCount[0].count)}
            icon={Key}
            color="orange"
            subtitle="Registration keys"
          />
        </Link>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <AdminStatCard
          title="Messages"
          value={Number(stats.totalMessages)}
          icon={Activity}
          color="cyan"
          subtitle="Private messages"
        />

        <Link href="/admin/servers">
          <AdminStatCard
            title="Servers"
            value={Number(serverCount[0].count)}
            icon={ServerIcon}
            color="pink"
            subtitle="Minecraft servers"
          />
        </Link>

        <AdminStatCard
          title="System Status"
          value="Operational"
          icon={TrendingUp}
          color="green"
          subtitle="All systems running"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <QuickActions />
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivity activities={recentActivity} />
        </div>
      </div>

      {/* Management Links */}
      <div className="glass border border-blue-500/20 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 gradient-text">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            href="/admin/users"
            label="Manage Users"
            icon={UsersIcon}
            color="blue"
          />
          <QuickLink
            href="/admin/servers"
            label="Server Control"
            icon={ServerIcon}
            color="purple"
          />
          <QuickLink
            href="/admin/donations"
            label="View Donations"
            icon={TrendingUp}
            color="green"
          />
          <QuickLink
            href="/admin/settings"
            label="System Settings"
            icon={Activity}
            color="cyan"
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
  color,
}: {
  href: string;
  label: string;
  icon: any;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 hover:bg-green-500/20 border-green-500/20',
    purple: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20',
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${colorClasses[color]}`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass border border-purple-500/20 rounded-2xl p-6 h-32 animate-pulse" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass border border-white/10 rounded-xl p-6 h-32 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
