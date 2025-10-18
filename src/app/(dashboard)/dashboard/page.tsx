import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth';
import { Activity } from 'lucide-react';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { DashboardActivity } from '@/components/dashboard/dashboard-activity';
import { DashboardQuickActions } from '@/components/dashboard/dashboard-quick-actions';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getServerSession();

  // Check if session exists and has user data
  if (!session || !session.user || !session.user.id) {
    return (
      <div className="space-y-8 fade-in-up">
        <div className="glass border border-red-500/20 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-6">Please sign in to access your dashboard.</p>
          <a 
            href="/auth/signin" 
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in-up">
      {/* Welcome Header - Loads immediately */}
      <div className="glass border border-green-500/20 rounded-2xl p-8 hover-lift">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-white">Welcome back, </span>
              <span className="gradient-text-animated">{session.user.name}</span>!
            </h1>
            <p className="text-gray-400 text-lg">
              Here's what's happening in your community
            </p>
          </div>
          <div className="hidden md:block">
            <Activity className="h-16 w-16 text-green-400 float" />
          </div>
        </div>
      </div>

      {/* Stats Grid - Loads asynchronously */}
      <Suspense fallback={
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass border border-green-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                <div className="w-6 h-6 bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-10 w-16 bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      }>
        <DashboardStats session={session} />
      </Suspense>

      {/* Recent Activity - Loads asynchronously */}
      <Suspense fallback={
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="glass border border-green-500/20 rounded-xl p-6">
              <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-16 w-full bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      }>
        <DashboardActivity session={session} />
      </Suspense>

      {/* Quick Actions - Loads immediately */}
      <DashboardQuickActions />
    </div>
  );
}

