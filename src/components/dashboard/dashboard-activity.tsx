import { db } from '@/db';
import { socialPosts, forumPosts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { TrendingUp, MessageSquare } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';

interface DashboardActivityProps {
  session: any;
}

export async function DashboardActivity({ session }: DashboardActivityProps) {
  // Force no caching - always fetch fresh data
  noStore();
  
  // Fetch user posts
  const userPosts = await db.query.socialPosts.findMany({
    where: eq(socialPosts.userId, parseInt(session.user.id)),
    limit: 5,
    orderBy: [desc(socialPosts.createdAt)],
  });

  const userForumPosts = await db.query.forumPosts.findMany({
    where: eq(forumPosts.authorId, parseInt(session.user.id)),
    limit: 5,
    orderBy: [desc(forumPosts.createdAt)],
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass border border-green-500/20 rounded-2xl p-6 hover-lift">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-400" />
          <h2 className="text-xl font-bold text-white">Recent Posts</h2>
        </div>
        {userPosts.length > 0 ? (
          <div className="space-y-3">
            {userPosts.map((post) => (
              <div key={post.id} className="glass border border-green-500/10 rounded-lg p-3 hover:border-green-500/30 transition-all">
                <p className="text-sm text-gray-300 line-clamp-2">{post.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No posts yet. Start sharing!</p>
        )}
      </div>

      <div className="glass border border-green-500/20 rounded-2xl p-6 hover-lift">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-green-400" />
          <h2 className="text-xl font-bold text-white">Forum Activity</h2>
        </div>
        {userForumPosts.length > 0 ? (
          <div className="space-y-3">
            {userForumPosts.map((post) => (
              <div key={post.id} className="glass border border-green-500/10 rounded-lg p-3 hover:border-green-500/30 transition-all">
                <p className="text-sm font-medium text-white">{post.title}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No forum posts yet. Start a discussion!</p>
        )}
      </div>
    </div>
  );
}
