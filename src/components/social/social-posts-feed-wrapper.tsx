import { db } from '@/db';
import { socialPosts, socialComments, socialLikes, users } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { SocialPostsFeedClient } from './social-posts-feed-client';
import { unstable_noStore as noStore } from 'next/cache';

interface SocialPostsFeedWrapperProps {
  session: any;
}

export async function SocialPostsFeedWrapper({ session }: SocialPostsFeedWrapperProps) {
  // Force no caching - always fetch fresh data
  noStore();
  
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

  // Posts are ready to use with our formatTimeAgo utility
  const postsWithTimestamps = posts.map((post) => ({
    ...post,
    likesCount: Number(post.likesCount),
    commentsCount: Number(post.commentsCount),
  }));

  return (
    <SocialPostsFeedClient 
      session={session} 
      initialPosts={postsWithTimestamps}
    />
  );
}
