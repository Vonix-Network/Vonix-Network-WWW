import { Suspense } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { ForumSkeleton } from '@/components/skeletons';
import { ForumCategories } from '@/components/forum/forum-categories';
import { ForumRecentPosts } from '@/components/forum/forum-recent-posts';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ForumPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in-up">
      {/* Header - Loads immediately */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Community</span> Forum
            </h1>
            <p className="text-gray-400">Discuss, share, and connect with the community</p>
          </div>
          <Link
            href="/forum/new"
            className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold overflow-hidden hover-lift glow-green"
          >
            <span className="relative z-10">Create Topic</span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>

      {/* Categories - Loads asynchronously */}
      <Suspense fallback={
        <div className="glass border border-green-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-400" />
            Categories
          </h2>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass border border-green-500/10 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-gray-700 rounded animate-pulse mb-2" />
                    <div className="h-4 w-48 bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-12 bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <ForumCategories />
      </Suspense>

      {/* Recent Posts - Loads asynchronously */}
      <Suspense fallback={
        <div className="glass border border-green-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-400" />
            Recent Topics
          </h2>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass border border-green-500/10 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-5 w-3/4 bg-gray-700 rounded animate-pulse mb-2" />
                    <div className="h-4 w-1/2 bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-4 w-12 bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <ForumRecentPosts />
      </Suspense>
    </div>
  );
}
