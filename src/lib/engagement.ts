import { db } from '@/db';
import { userEngagement } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// Point values for different actions
export const ENGAGEMENT_POINTS = {
  SOCIAL_POST: 5,
  SOCIAL_COMMENT: 3,
  FORUM_POST: 10,
  FORUM_REPLY: 5,
  UPVOTE_RECEIVED: 2,
  DOWNVOTE_RECEIVED: -1,
  LIKE_RECEIVED: 1,
};

export async function initializeUserEngagement(userId: number) {
  try {
    await db.insert(userEngagement).values({
      userId,
      totalPoints: 0,
      postsCreated: 0,
      commentsCreated: 0,
      forumPostsCreated: 0,
      forumRepliesCreated: 0,
      upvotesReceived: 0,
      downvotesReceived: 0,
      likesReceived: 0,
      updatedAt: new Date(),
    }).onConflictDoNothing();
  } catch (error) {
    console.error('Error initializing user engagement:', error);
  }
}

export async function updateEngagement(
  userId: number,
  action: keyof typeof ENGAGEMENT_POINTS,
  increment: number = 1
) {
  try {
    // Ensure user engagement record exists
    await initializeUserEngagement(userId);

    const points = ENGAGEMENT_POINTS[action] * increment;

    // Update based on action type
    switch (action) {
      case 'SOCIAL_POST':
        await db
          .update(userEngagement)
          .set({
            postsCreated: sql`${userEngagement.postsCreated} + ${increment}`,
            totalPoints: sql`${userEngagement.totalPoints} + ${points}`,
            updatedAt: new Date(),
          })
          .where(eq(userEngagement.userId, userId));
        break;

      case 'SOCIAL_COMMENT':
        await db
          .update(userEngagement)
          .set({
            commentsCreated: sql`${userEngagement.commentsCreated} + ${increment}`,
            totalPoints: sql`${userEngagement.totalPoints} + ${points}`,
            updatedAt: new Date(),
          })
          .where(eq(userEngagement.userId, userId));
        break;

      case 'FORUM_POST':
        await db
          .update(userEngagement)
          .set({
            forumPostsCreated: sql`${userEngagement.forumPostsCreated} + ${increment}`,
            totalPoints: sql`${userEngagement.totalPoints} + ${points}`,
            updatedAt: new Date(),
          })
          .where(eq(userEngagement.userId, userId));
        break;

      case 'FORUM_REPLY':
        await db
          .update(userEngagement)
          .set({
            forumRepliesCreated: sql`${userEngagement.forumRepliesCreated} + ${increment}`,
            totalPoints: sql`${userEngagement.totalPoints} + ${points}`,
            updatedAt: new Date(),
          })
          .where(eq(userEngagement.userId, userId));
        break;

      case 'UPVOTE_RECEIVED':
        await db
          .update(userEngagement)
          .set({
            upvotesReceived: sql`${userEngagement.upvotesReceived} + ${increment}`,
            totalPoints: sql`${userEngagement.totalPoints} + ${points}`,
            updatedAt: new Date(),
          })
          .where(eq(userEngagement.userId, userId));
        break;

      case 'DOWNVOTE_RECEIVED':
        await db
          .update(userEngagement)
          .set({
            downvotesReceived: sql`${userEngagement.downvotesReceived} + ${increment}`,
            totalPoints: sql`${userEngagement.totalPoints} + ${points}`,
            updatedAt: new Date(),
          })
          .where(eq(userEngagement.userId, userId));
        break;

      case 'LIKE_RECEIVED':
        await db
          .update(userEngagement)
          .set({
            likesReceived: sql`${userEngagement.likesReceived} + ${increment}`,
            totalPoints: sql`${userEngagement.totalPoints} + ${points}`,
            updatedAt: new Date(),
          })
          .where(eq(userEngagement.userId, userId));
        break;
    }

    console.log(`✅ Updated engagement for user ${userId}: ${action} (+${points} points)`);
  } catch (error) {
    console.error('Error updating engagement:', error);
  }
}

export async function recalculateUserEngagement(userId: number) {
  // This function can be used to recalculate a user's total engagement from scratch
  // Useful for fixing discrepancies or initial data migration
  try {
    const [engagement] = await db
      .select()
      .from(userEngagement)
      .where(eq(userEngagement.userId, userId));

    if (!engagement) {
      await initializeUserEngagement(userId);
      return;
    }

    const totalPoints =
      engagement.postsCreated * ENGAGEMENT_POINTS.SOCIAL_POST +
      engagement.commentsCreated * ENGAGEMENT_POINTS.SOCIAL_COMMENT +
      engagement.forumPostsCreated * ENGAGEMENT_POINTS.FORUM_POST +
      engagement.forumRepliesCreated * ENGAGEMENT_POINTS.FORUM_REPLY +
      engagement.upvotesReceived * ENGAGEMENT_POINTS.UPVOTE_RECEIVED +
      engagement.downvotesReceived * ENGAGEMENT_POINTS.DOWNVOTE_RECEIVED +
      engagement.likesReceived * ENGAGEMENT_POINTS.LIKE_RECEIVED;

    await db
      .update(userEngagement)
      .set({
        totalPoints,
        updatedAt: new Date(),
      })
      .where(eq(userEngagement.userId, userId));

    console.log(`✅ Recalculated engagement for user ${userId}: ${totalPoints} points`);
  } catch (error) {
    console.error('Error recalculating engagement:', error);
  }
}
