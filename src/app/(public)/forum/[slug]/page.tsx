import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { forumCategories, forumPosts, forumReplies, users } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Pin, Lock, Eye, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notFound } from 'next/navigation';
import { formatTimeAgo, stripBBCode } from '@/lib/date-utils';
import { unstable_noStore as noStore } from 'next/cache';
import { ForumTopicList } from '@/components/forum/forum-topic-list';

// Force dynamic rendering - NO CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface CategoryPageProps {
  params: { slug: string };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // Force no caching - always fetch fresh data
  noStore();
  const session = await getServerSession(); // Optional - guests can view

  // Unwrap params Promise (Next.js 16 requirement)
  const { slug } = await params;

  // Get category
  const [category] = await db
    .select()
    .from(forumCategories)
    .where(eq(forumCategories.slug, slug));

  if (!category) {
    notFound();
  }

  // Get posts in this category
  const posts = await db
    .select({
      id: forumPosts.id,
      title: forumPosts.title,
      content: forumPosts.content,
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
    .leftJoin(users, eq(forumPosts.authorId, users.id))
    .leftJoin(forumReplies, eq(forumPosts.id, forumReplies.postId))
    .where(eq(forumPosts.categoryId, category.id))
    .groupBy(forumPosts.id, users.id)
    .orderBy(desc(forumPosts.pinned), desc(forumPosts.createdAt))
    .limit(50);

  // Convert timestamps to Date objects with null check
  const postsWithTimestamps = posts.map((post) => ({
    ...post,
    createdAt: post.createdAt 
      ? (post.createdAt instanceof Date 
          ? post.createdAt 
          : new Date(typeof post.createdAt === 'number' ? post.createdAt * 1000 : post.createdAt))
      : new Date(),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forum
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <span className="text-4xl">{category.icon || '📁'}</span>
              <span className="gradient-text">{category.name}</span>
            </h1>
            <p className="text-gray-400">{category.description}</p>
          </div>
          {session ? (
            <Link
              href="/forum/new"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold overflow-hidden hover-lift glow-green"
            >
              <Plus className="h-5 w-5 relative z-10" />
              <span className="relative z-10">New Topic</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold overflow-hidden hover-lift glow-green"
            >
              <span className="relative z-10">Login to Post</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )}
        </div>
      </div>

      {/* Topics - Client component for real-time updates */}
      <ForumTopicList
        categorySlug={slug}
        categoryId={category.id}
        initialTopics={postsWithTimestamps}
      />
    </div>
  );
}
