import { db } from '@/db';
import { socialPosts, socialComments, socialLikes, users } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { PostCard } from '@/components/social/post-card';
import { TrendingUp } from 'lucide-react';

interface SocialPostsFeedProps {
  session: any;
}

export async function SocialPostsFeed({ session }: SocialPostsFeedProps) {
  // Fetch posts with author info and engagement counts
  const posts = await db
    .select({
      id: socialPosts.id,
      content: socialPosts.content,
      imageUrl: socialPosts.imageUrl,
      createdAt: socialPosts.createdAt,
      author: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        minecraftUsername: users.minecraftUsername,
        role: users.role,
        donationRankId: users.donationRankId,
      },
      likesCount: sql<number>`count(distinct ${socialLikes.id})`.as('likes_count'),
      commentsCount: sql<number>`count(distinct ${socialComments.id})`.as('comments_count'),
    })
    .from(socialPosts)
    .leftJoin(users, eq(socialPosts.userId, users.id))
    .leftJoin(socialLikes, eq(socialPosts.id, socialLikes.postId))
    .leftJoin(socialComments, eq(socialPosts.id, socialComments.postId))
    .groupBy(socialPosts.id, users.id)
    .orderBy(desc(socialPosts.createdAt))
    .limit(50);

  // Get user's liked posts
  const userLikes = await db
    .select({ postId: socialLikes.postId })
    .from(socialLikes)
    .where(eq(socialLikes.userId, parseInt(session!.user.id)));

  const likedPostIds = new Set(userLikes.map((like) => like.postId));

  // Posts are ready to use with our formatTimeAgo utility
  const postsWithTimestamps = posts.map((post) => ({
    ...post,
    likesCount: Number(post.likesCount),
    commentsCount: Number(post.commentsCount),
  }));

  return (
    <div className="space-y-4">
      {postsWithTimestamps.length > 0 ? (
        postsWithTimestamps.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isLiked={likedPostIds.has(post.id)}
            currentUserId={parseInt(session!.user.id)}
          />
        ))
      ) : (
        <div className="glass border border-green-500/20 rounded-2xl p-12 text-center">
          <TrendingUp className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No posts yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
}

