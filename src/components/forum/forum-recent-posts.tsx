import { db } from '@/db';
import { forumPosts, forumCategories, users, forumReplies } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import { MessageSquare, Pin, Lock, Eye } from 'lucide-react';
import { formatTimeAgo } from '@/lib/date-utils';
import { unstable_noStore as noStore } from 'next/cache';

export async function ForumRecentPosts() {
  // Force no caching - always fetch fresh data
  noStore();
  
  // Fetch recent posts
  const recentPosts = await db
    .select({
      id: forumPosts.id,
      title: forumPosts.title,
      categoryId: forumPosts.categoryId,
      categoryName: forumCategories.name,
      categorySlug: forumCategories.slug,
      pinned: forumPosts.pinned,
      locked: forumPosts.locked,
      views: forumPosts.views,
      createdAt: forumPosts.createdAt,
      author: {
        username: users.username,
      },
      replyCount: sql<number>`count(${forumReplies.id})`.as('reply_count'),
    })
    .from(forumPosts)
    .leftJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .leftJoin(users, eq(forumPosts.authorId, users.id))
    .leftJoin(forumReplies, eq(forumPosts.id, forumReplies.postId))
    .groupBy(forumPosts.id, forumCategories.id, users.id)
    .orderBy(desc(forumPosts.pinned), desc(forumPosts.createdAt))
    .limit(10);

  return (
    <div className="glass border border-green-500/20 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-green-400" />
        Recent Topics
      </h2>
      <div className="space-y-2">
        {recentPosts.map((post) => (
          <Link
            key={post.id}
            href={`/forum/${post.categorySlug}/${post.id}`}
            className="group block glass border border-green-500/10 hover:border-green-500/30 rounded-xl p-4 transition-all hover-lift"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {post.pinned && <Pin className="h-4 w-4 text-green-400" />}
                  {post.locked && <Lock className="h-4 w-4 text-gray-400" />}
                  <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">
                    {post.title}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="text-green-400">{post.categoryName}</span>
                  <span>by {post.author?.username || 'Unknown'}</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-400">
                  <Eye className="h-4 w-4" />
                  <span>{post.views}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <MessageSquare className="h-4 w-4" />
                  <span>{Number(post.replyCount)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
