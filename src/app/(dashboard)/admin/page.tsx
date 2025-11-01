import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { 
  users, 
  socialPosts, 
  forumPosts, 
  privateMessages, 
  registrationCodes, 
  servers, 
  forumReplies, 
  socialLikes,
  reportedContent,
  donations,
  donationRanks
} from '@/db/schema';
import { sql, desc, eq, and, gte } from 'drizzle-orm';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  FileText, 
  Server,
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Crown,
  Flag,
  Zap,
  Database,
  Cpu,
  HardDrive,
  Network,
  Eye,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function AdminContent() {
  await requireAdmin();

  // Calculate date 24 hours ago for new users
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Core Statistics
  const [coreStats] = await db
    .select({
      totalUsers: sql<number>`count(distinct ${users.id})`,
      newUsersToday: sql<number>`count(distinct case when ${users.createdAt} >= ${oneDayAgo} then ${users.id} end)`,
      totalPosts: sql<number>`count(distinct ${socialPosts.id})`,
      totalForumPosts: sql<number>`count(distinct ${forumPosts.id})`,
      totalMessages: sql<number>`count(distinct ${privateMessages.id})`,
    })
    .from(users)
    .leftJoin(socialPosts, sql`true`)
    .leftJoin(forumPosts, sql`true`)
    .leftJoin(privateMessages, sql`true`);

  // Reports & Moderation
  const [moderationStats] = await db
    .select({
      pendingReports: sql<number>`count(case when ${reportedContent.status} = 'pending' then 1 end)`,
      totalReports: sql<number>`count(*)`,
    })
    .from(reportedContent);

  // Revenue Statistics
  const [revenueStats] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${donations.amount}), 0)`,
      monthlyRevenue: sql<number>`coalesce(sum(case when ${donations.createdAt} >= date('now', 'start of month') then ${donations.amount} else 0 end), 0)`,
      totalDonations: sql<number>`count(*)`,
    })
    .from(donations);

  // Server Statistics
  const totalServers = await db
    .select({ count: sql<number>`count(*)` })
    .from(servers);

  // Get active registration codes
  const activeCodesCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(registrationCodes)
    .where(eq(registrationCodes.used, false));

  // Recent Activity - Users
  const recentUsers = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(5);

  // Recent Reports
  const recentReports = await db
    .select({
      id: reportedContent.id,
      contentType: reportedContent.contentType,
      reason: reportedContent.reason,
      status: reportedContent.status,
      createdAt: reportedContent.createdAt,
      reporter: users.username,
    })
    .from(reportedContent)
    .leftJoin(users, eq(reportedContent.reporterId, users.id))
    .orderBy(desc(reportedContent.createdAt))
    .limit(5);

  // Recent Donations
  const recentDonations = await db
    .select({
      id: donations.id,
      amount: donations.amount,
      createdAt: donations.createdAt,
      user: users.username,
    })
    .from(donations)
    .leftJoin(users, eq(donations.userId, users.id))
    .orderBy(desc(donations.createdAt))
    .limit(5);

  // System Health Metrics (mock data - replace with real monitoring)
  const systemHealth = {
    cpu: 45, // percentage
    memory: 62,
    disk: 38,
    uptime: '15d 7h 23m',
    latency: 12, // ms
  };

  // Calculate growth percentages (mock - replace with real historical data)
  const userGrowth = 12.5; // percentage
  const revenueGrowth = 23.4;
  const activityGrowth = -5.2;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatNumber = (num: number) => num.toLocaleString();
  const formatTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="glass border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-400" />
              <span className="gradient-text">Enterprise</span> Admin
            </h1>
            <p className="text-gray-400">Complete platform management and configuration</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Badge variant="outline" className="text-green-400 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              System Healthy
            </Badge>
            <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
              <Activity className="h-3 w-3 mr-1" />
              {formatNumber(Number(coreStats.totalUsers))} Users
            </Badge>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={formatNumber(Number(coreStats.totalUsers))}
          change={`+${userGrowth}%`}
          trend="up"
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(Number(revenueStats.totalRevenue))}
          change={`+${revenueGrowth}%`}
          trend="up"
          icon={<DollarSign className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          title="Content Posts"
          value={formatNumber(Number(coreStats.totalPosts) + Number(coreStats.totalForumPosts))}
          change={activityGrowth > 0 ? `+${activityGrowth}%` : `${activityGrowth}%`}
          trend={activityGrowth > 0 ? 'up' : 'down'}
          icon={<FileText className="h-5 w-5" />}
          color="purple"
        />
        <StatsCard
          title="Pending Reports"
          value={formatNumber(Number(moderationStats.pendingReports))}
          change={`${moderationStats.totalReports} total`}
          trend="neutral"
          icon={<Flag className="h-5 w-5" />}
          color="red"
        />
      </div>

      {/* System Health & Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* System Health */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              System Health
            </CardTitle>
            <CardDescription>Real-time platform performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <HealthMetric
                label="CPU Usage"
                value={systemHealth.cpu}
                unit="%"
                icon={<Cpu className="h-4 w-4" />}
              />
              <HealthMetric
                label="Memory"
                value={systemHealth.memory}
                unit="%"
                icon={<Database className="h-4 w-4" />}
              />
              <HealthMetric
                label="Disk Usage"
                value={systemHealth.disk}
                unit="%"
                icon={<HardDrive className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Uptime: {systemHealth.uptime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Zap className="h-4 w-4" />
                <span>Latency: {systemHealth.latency}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">New Users</span>
              <Badge variant="outline" className="text-green-400">
                +{formatNumber(Number(coreStats.newUsersToday))}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Active Servers</span>
              <Badge variant="outline" className="text-cyan-400">
                {formatNumber(Number(totalServers[0].count))}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Total Messages</span>
              <Badge variant="outline" className="text-purple-400">
                {formatNumber(Number(coreStats.totalMessages))}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-400" />
                Recent Users
              </CardTitle>
              <CardDescription>Latest user registrations</CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.username}</p>
                      <p className="text-xs text-gray-400">{formatTime(user.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    user.role === 'admin' ? 'text-red-400 border-red-500/30' :
                    user.role === 'moderator' ? 'text-purple-400 border-purple-500/30' :
                    'text-cyan-400 border-cyan-500/30'
                  }>
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-400" />
                Recent Reports
              </CardTitle>
              <CardDescription>Latest content reports</CardDescription>
            </div>
            <Link href="/admin/reports">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Flag className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{report.contentType.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400">by {report.reporter || 'Unknown'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    report.status === 'pending' ? 'text-yellow-400 border-yellow-500/30' :
                    report.status === 'reviewed' ? 'text-green-400 border-green-500/30' :
                    'text-gray-400 border-gray-500/30'
                  }>
                    {report.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview */}
      {Number(revenueStats.totalRevenue) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Revenue Overview
            </CardTitle>
            <CardDescription>Financial performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
                <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(Number(revenueStats.totalRevenue))}</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
                <p className="text-sm text-gray-400 mb-1">This Month</p>
                <p className="text-2xl font-bold text-cyan-400">{formatCurrency(Number(revenueStats.monthlyRevenue))}</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
                <p className="text-sm text-gray-400 mb-1">Total Donations</p>
                <p className="text-2xl font-bold text-purple-400">{formatNumber(Number(revenueStats.totalDonations))}</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
                <p className="text-sm text-gray-400 mb-1">Growth</p>
                <p className="text-2xl font-bold text-orange-400">+{revenueGrowth}%</p>
              </div>
            </div>
            {recentDonations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Recent Donations</h4>
                <div className="space-y-2">
                  {recentDonations.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                      <span className="text-sm text-gray-400">{donation.user || 'Anonymous'}</span>
                      <span className="text-sm font-medium text-green-400">{formatCurrency(Number(donation.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Management Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/admin/users" icon={<Users className="h-5 w-5" />} title="User Management" description="Manage all platform users" />
        <QuickLink href="/admin/servers" icon={<Server className="h-5 w-5" />} title="Server Management" description="Monitor and configure servers" />
        <QuickLink href="/admin/donations" icon={<DollarSign className="h-5 w-5" />} title="Donations" description="View donations and transactions" />
        <QuickLink href="/admin/settings" icon={<Shield className="h-5 w-5" />} title="System Settings" description="Platform configuration" />
      </div>
    </div>
  );
}

// Stats Card with Trend
function StatsCard({
  title,
  value,
  change,
  trend,
  icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'red';
}) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-400">{title}</span>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        </div>
        <p className="text-3xl font-bold text-white mb-2">{value}</p>
        <div className="flex items-center gap-1 text-sm">
          {trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-400" />}
          {trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-400" />}
          <span className={trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}>
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Health Metric Component
function HealthMetric({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
}) {
  const getColor = (val: number) => {
    if (val < 50) return 'text-green-400';
    if (val < 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${getColor(value)}`}>
        {value}{unit}
      </p>
    </div>
  );
}

// Quick Link Component
function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-cyan-500/30 transition-all cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">{title}</h3>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AdminSkeleton() {
  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6">
      {/* Header Skeleton */}
      <Card className="border-red-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-48 bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-6 w-64 bg-gray-700 rounded animate-pulse" />
        </CardContent>
      </Card>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                <div className="w-10 h-10 bg-gray-700 rounded-lg animate-pulse" />
              </div>
              <div className="h-10 w-16 bg-gray-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-32 w-full bg-gray-700 rounded animate-pulse" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-32 w-full bg-gray-700 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-40 bg-gray-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full bg-gray-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
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
