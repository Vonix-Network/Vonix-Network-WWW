import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { FriendsList } from '@/components/friends/friends-list';
import { FriendRequests } from '@/components/friends/friend-requests';
import { Users, UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FriendsPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="space-y-8 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text-animated">Friends</span>
          </h1>
          <p className="text-gray-400">Manage your connections</p>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Users className="h-5 w-5" />
          <span className="text-sm">Your network</span>
        </div>
      </div>

      {/* Friend Requests */}
      <Suspense
        fallback={
          <div className="glass border border-blue-500/20 rounded-2xl p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-48 mb-4" />
              <div className="h-20 bg-gray-700 rounded" />
            </div>
          </div>
        }
      >
        <FriendRequests />
      </Suspense>

      {/* Friends List */}
      <Suspense
        fallback={
          <div className="glass border border-blue-500/20 rounded-2xl p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-700 rounded w-32 mb-4" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <FriendsList />
      </Suspense>
    </div>
  );
}
