import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth';
import { CreatePostForm } from '@/components/social/create-post-form';
import { Users as UsersIcon } from 'lucide-react';
import { SocialPostsFeedWrapper } from '@/components/social/social-posts-feed-wrapper';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SocialPage() {
  const session = await getServerSession();

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in-up">
      {/* Header - Loads immediately */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Social</span> Feed
            </h1>
            <p className="text-gray-400">Share updates and connect with the community</p>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">-</div>
              <div className="text-xs text-gray-400">Posts</div>
            </div>
            <div className="text-center">
              <UsersIcon className="h-8 w-8 text-green-400 mx-auto float" />
            </div>
          </div>
        </div>
      </div>

      {/* Create Post - Loads immediately */}
      <div className="glass border border-green-500/20 rounded-2xl p-6 hover-lift">
        <CreatePostForm userId={parseInt(session!.user.id)} />
      </div>

      {/* Posts Feed - Loads asynchronously */}
      <Suspense fallback={
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      }>
        <SocialPostsFeedWrapper session={session} />
      </Suspense>
    </div>
  );
}
