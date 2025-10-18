// Loading components for forum and social pages
import { Loader2, MessageSquare, Users, FileText } from 'lucide-react';

export function ForumSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Forum Categories Skeleton */}
      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-blue-400" />
          <div className="h-6 w-32 bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border border-gray-700 rounded-lg">
              <div className="h-5 w-24 bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Forum Posts Skeleton */}
      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-40 bg-gray-700 rounded animate-pulse" />
          <div className="h-9 w-24 bg-gray-700 rounded animate-pulse" />
        </div>

        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-6 w-48 bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-700 rounded animate-pulse mb-1" />
                <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse mb-3" />
                <div className="flex items-center gap-4">
                  <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SocialSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Social Header Skeleton */}
      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-green-400" />
          <div className="h-6 w-24 bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-4 w-48 bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Social Posts Skeleton */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-24 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-16 bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-16 bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-16 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Post Header Skeleton */}
      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-4" />
            <div className="h-5 w-48 bg-gray-700 rounded animate-pulse mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Comments Skeleton */}
      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-6" />

        {[...Array(3)].map((_, i) => (
          <div key={i} className="border-b border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-700 rounded animate-pulse mb-1" />
                <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Skeleton */}
      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gray-700 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-5 w-32 bg-gray-700 rounded animate-pulse mb-4" />
            <div className="h-4 w-64 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Profile Tabs Skeleton */}
      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="flex gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-20 bg-gray-700 rounded animate-pulse" />
          ))}
        </div>

        {/* Activity Skeleton */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-700 rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-5 w-48 bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Leaderboard Header Skeleton */}
      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-yellow-400" />
          <div className="h-6 w-32 bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-4 w-48 bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Leaderboard Table Skeleton */}
      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse" />
                <div>
                  <div className="h-5 w-32 bg-gray-700 rounded animate-pulse mb-1" />
                  <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-6 w-16 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
