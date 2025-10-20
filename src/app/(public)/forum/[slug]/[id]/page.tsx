import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { forumCategories, forumPosts, forumReplies, users, donationRanks } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Pin, Lock, Eye, Clock, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notFound } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { BBCode } from '@/lib/bbcode';
import { formatTimeAgo } from '@/lib/date-utils';
import { PostActions } from '@/components/forum/post-actions';
import { ReplyForm } from '@/components/forum/reply-form';
import { ForumRepliesSection } from '@/components/forum/forum-replies-section';
import { unstable_noStore as noStore } from 'next/cache';

// Force dynamic rendering - NO CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface PostPageProps {
  params: { slug: string; id: string };
}

export default async function PostPage({ params }: PostPageProps) {
  // Force no caching - always fetch fresh data
  noStore();
  const session = await getServerSession();
  const postId = parseInt(params.id);

  if (isNaN(postId)) {
    notFound();
  }

  // Get the post with author and category info
  const [postData] = await db
    .select({
      post: forumPosts,
      author: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        minecraftUsername: users.minecraftUsername,
        role: users.role,
        donationRankId: users.donationRankId,
      },
      category: {
        name: forumCategories.name,
        slug: forumCategories.slug,
        icon: forumCategories.icon,
      },
    })
    .from(forumPosts)
    .leftJoin(users, eq(forumPosts.authorId, users.id))
    .leftJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .where(eq(forumPosts.id, postId));

  if (!postData) {
    notFound();
  }

  // Increment view count
  await db
    .update(forumPosts)
    .set({ views: postData.post.views + 1 })
    .where(eq(forumPosts.id, postId));

  // Get replies
  const replies = await db
    .select({
      id: forumReplies.id,
      content: forumReplies.content,
      createdAt: forumReplies.createdAt,
      author: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        minecraftUsername: users.minecraftUsername,
        role: users.role,
        donationRankId: users.donationRankId,
      },
    })
    .from(forumReplies)
    .leftJoin(users, eq(forumReplies.authorId, users.id))
    .where(eq(forumReplies.postId, postId))
    .orderBy(forumReplies.createdAt);

  // Get donation ranks for badge display
  const ranks = await db.select().from(donationRanks);
  const rankMap = new Map(ranks.map(r => [r.id, r]));

  // Convert timestamps to Date objects with null check
  const repliesWithTimestamps = replies.map((reply) => ({
    ...reply,
    createdAt: reply.createdAt 
      ? (reply.createdAt instanceof Date 
          ? reply.createdAt 
          : new Date(typeof reply.createdAt === 'number' ? reply.createdAt * 1000 : reply.createdAt))
      : new Date(),
  }));

  const postCreatedAt = postData.post.createdAt 
    ? (postData.post.createdAt instanceof Date 
        ? postData.post.createdAt 
        : new Date(typeof postData.post.createdAt === 'number' ? postData.post.createdAt * 1000 : postData.post.createdAt))
    : new Date();

  // Check permissions
  const isAuthor = session && postData.author && session.user.id === postData.author.id.toString();
  const isModerator = session && (session.user.role === 'moderator' || session.user.role === 'admin');

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <Link
          href={`/forum/${params.slug}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {postData.category?.name || 'Forum'}
        </Link>

        {/* Post Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {postData.post.pinned && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned
                </span>
              )}
              {postData.post.locked && (
                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{postData.post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {postData.post.views} views
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {repliesWithTimestamps.length} replies
            </span>
          </div>
        </div>
          
        {/* Post Actions */}
        <PostActions
          postId={postData.post.id}
          categorySlug={params.slug}
          isAuthor={!!isAuthor}
          isModerator={!!isModerator}
          isPinned={postData.post.pinned}
          isLocked={postData.post.locked}
        />
      </div>

      {/* Original Post */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <div className="flex gap-4">
          {/* Author Info */}
          <div className="flex flex-col items-center gap-2 min-w-[120px]">
            <Avatar
              username={postData.author?.username || 'Unknown'}
              minecraftUsername={postData.author?.minecraftUsername}
              avatar={postData.author?.avatar}
              size="lg"
            />
            <div className="text-center">
              <div 
                className="font-semibold"
                style={{
                  color: postData.author?.donationRankId && rankMap.has(postData.author.donationRankId)
                    ? (rankMap.get(postData.author.donationRankId)!.textColor !== '#000000' && rankMap.get(postData.author.donationRankId)!.textColor !== '#000'
                      ? rankMap.get(postData.author.donationRankId)!.textColor
                      : '#ffffff')
                    : '#ffffff'
                }}
              >
                {postData.author?.username || 'Unknown'}
              </div>
              {postData.author?.role && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  postData.author.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                  postData.author.role === 'moderator' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {postData.author.role.charAt(0).toUpperCase() + postData.author.role.slice(1)}
                </span>
              )}
              {postData.author?.donationRankId && rankMap.has(postData.author.donationRankId) && (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold" style={{
                    backgroundColor: rankMap.get(postData.author.donationRankId)!.color + '20',
                    color: (rankMap.get(postData.author.donationRankId)!.textColor !== '#000000' && rankMap.get(postData.author.donationRankId)!.textColor !== '#000') ? rankMap.get(postData.author.donationRankId)!.textColor : '#ffffff',
                    border: `1px solid ${rankMap.get(postData.author.donationRankId)!.color}40`,
                  }}>
                    <Crown className="h-3 w-3" />
                    {rankMap.get(postData.author.donationRankId)!.badge || rankMap.get(postData.author.donationRankId)!.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(postData.post.createdAt)}
            </div>
            <div className="prose prose-invert max-w-none break-words">
              <BBCode className="text-gray-300">{postData.post.content}</BBCode>
            </div>
          </div>
        </div>
      </div>

      {/* Replies - Client component for real-time updates */}
      <ForumRepliesSection 
        postId={postData.post.id}
        initialReplies={repliesWithTimestamps}
        session={session}
        rankMap={rankMap}
      />

      {/* Locked Message */}
      {postData.post.locked && (
        <div className="glass border border-gray-500/20 rounded-2xl p-6 text-center">
          <Lock className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">This topic has been locked and no longer accepts new replies.</p>
        </div>
      )}
    </div>
  );
}
