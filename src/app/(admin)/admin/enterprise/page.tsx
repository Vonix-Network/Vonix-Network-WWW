/**
 * Enterprise Admin Dashboard - Premium Version
 * Showcasing new design system and components
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { RBAC } from '@/lib/rbac';
import { db } from '@/db';
import { users, donations, socialPosts, forumPosts, reportedContent } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import {
  Users,
  DollarSign,
  TrendingUp,
  Flag,
  MessageSquare,
  Globe,
  Crown,
  Activity,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/enterprise-card';
import { RecentUsersTable } from '@/components/admin/recent-users-table';

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalRevenue: number;
  revenueThisMonth: number;
  pendingReports: number;
  activeSocialPosts: number;
  activeForumPosts: number;
  donorCount: number;
}

interface RecentUser {
  id: number;
  username: string;
  role: string;
  createdAt: Date;
}

async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Get all stats in parallel
  const [
    totalUsers,
    newUsersToday,
    totalRevenue,
    revenueThisMonth,
    pendingReports,
    activeSocialPosts,
    activeForumPosts,
    donorCount,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users).then(r => r[0]?.count || 0),
    db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, today))
      .then(r => r[0]?.count || 0),
    db.select({ sum: sql<number>`coalesce(sum(${donations.amount}), 0)` })
      .from(donations)
      .then(r => r[0]?.sum || 0),
    db.select({ sum: sql<number>`coalesce(sum(${donations.amount}), 0)` })
      .from(donations)
      .where(gte(donations.createdAt, firstDayOfMonth))
      .then(r => r[0]?.sum || 0),
    db.select({ count: sql<number>`count(*)` })
      .from(reportedContent)
      .where(eq(reportedContent.status, 'pending'))
      .then(r => r[0]?.count || 0),
    db.select({ count: sql<number>`count(*)` }).from(socialPosts).then(r => r[0]?.count || 0),
    db.select({ count: sql<number>`count(*)` }).from(forumPosts).then(r => r[0]?.count || 0),
    db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.donationRankId} IS NOT NULL`)
      .then(r => r[0]?.count || 0),
  ]);

  return {
    totalUsers,
    newUsersToday,
    totalRevenue,
    revenueThisMonth,
    pendingReports,
    activeSocialPosts,
    activeForumPosts,
    donorCount,
  };
}

async function getRecentUsers(): Promise<RecentUser[]> {
  const recentUsers = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} DESC`)
    .limit(10);

  return recentUsers.map(u => ({
    ...u,
    createdAt: new Date(u.createdAt),
  }));
}

export default async function EnterpriseAdminPage() {
  const session = await getServerSession();

  if (!session || !RBAC.canAccessAdmin(session.user.role)) {
    redirect('/login');
  }

  const [stats, recentUsers] = await Promise.all([
    getDashboardStats(),
    getRecentUsers(),
  ]);

  // Calculate trends (mock data for now)
  const userGrowth = stats.newUsersToday > 0 ? 12 : 0;
  const revenueGrowth = stats.revenueThisMonth > 0 ? 8 : 0;

  // Columns and row interactivity are handled client-side in RecentUsersTable

  return (
    <div className="min-h-screen p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.username}. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={userGrowth > 0 ? { value: userGrowth, isPositive: true } : undefined}
          description={`+${stats.newUsersToday} today`}
          variant="info"
        />

        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={revenueGrowth > 0 ? { value: revenueGrowth, isPositive: true } : undefined}
          description={`$${stats.revenueThisMonth.toLocaleString()} this month`}
          variant="success"
        />

        <StatCard
          title="Pending Reports"
          value={stats.pendingReports}
          icon={Flag}
          description="Requires attention"
          variant={stats.pendingReports > 0 ? 'warning' : 'default'}
        />

        <StatCard
          title="Active Donors"
          value={stats.donorCount}
          icon={Crown}
          description="With active ranks"
          variant="default"
        />
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" hover>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Community Activity</CardTitle>
                <CardDescription>Recent platform engagement</CardDescription>
              </div>
              <div className="p-3 bg-brand-cyan/10 rounded-lg">
                <Activity className="h-6 w-6 text-brand-cyan" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-brand-cyan" />
                  <span className="text-sm font-medium">Social Posts</span>
                </div>
                <span className="text-2xl font-bold">{stats.activeSocialPosts}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Forum Posts</span>
                </div>
                <span className="text-2xl font-bold">{stats.activeForumPosts}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/admin/users"
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 transition-all group text-center"
              >
                <Users className="h-6 w-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Manage Users</p>
              </a>
              
              <a
                href="/admin/donations"
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-success/30 transition-all group text-center"
              >
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-success group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">View Donations</p>
              </a>
              
              <a
                href="/admin/reports"
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-warning/30 transition-all group text-center"
              >
                <Flag className="h-6 w-6 mx-auto mb-2 text-warning group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Review Reports</p>
              </a>
              
              <a
                href="/admin/donor-ranks"
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-cyan/30 transition-all group text-center"
              >
                <Crown className="h-6 w-6 mx-auto mb-2 text-brand-cyan group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Donor Ranks</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users Table */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Latest registered members</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentUsersTable users={recentUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
