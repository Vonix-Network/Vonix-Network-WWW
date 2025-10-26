import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { reportedContent, socialPosts, forumPosts, forumReplies, groupPosts, groupPostComments, socialComments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const reportSchema = z.object({
  contentType: z.enum(['social_post', 'forum_post', 'forum_reply', 'group_post', 'group_comment', 'social_comment']),
  contentId: z.number().int().positive(),
  reason: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
});

/**
 * POST /api/report - Report content (universal endpoint for all content types)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = reportSchema.parse(body);

    // Verify content exists based on type
    let contentExists = false;
    switch (validatedData.contentType) {
      case 'social_post':
        const socialPost = await db.select().from(socialPosts).where(eq(socialPosts.id, validatedData.contentId)).get();
        contentExists = !!socialPost;
        break;
      case 'forum_post':
        const forumPost = await db.select().from(forumPosts).where(eq(forumPosts.id, validatedData.contentId)).get();
        contentExists = !!forumPost;
        break;
      case 'forum_reply':
        const forumReply = await db.select().from(forumReplies).where(eq(forumReplies.id, validatedData.contentId)).get();
        contentExists = !!forumReply;
        break;
      case 'group_post':
        const groupPost = await db.select().from(groupPosts).where(eq(groupPosts.id, validatedData.contentId)).get();
        contentExists = !!groupPost;
        break;
      case 'group_comment':
        const groupComment = await db.select().from(groupPostComments).where(eq(groupPostComments.id, validatedData.contentId)).get();
        contentExists = !!groupComment;
        break;
      case 'social_comment':
        const socialComment = await db.select().from(socialComments).where(eq(socialComments.id, validatedData.contentId)).get();
        contentExists = !!socialComment;
        break;
    }

    if (!contentExists) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check if user already reported this content
    const existingReport = await db
      .select()
      .from(reportedContent)
      .where(
        and(
          eq(reportedContent.contentType, validatedData.contentType),
          eq(reportedContent.contentId, validatedData.contentId),
          eq(reportedContent.reporterId, Number(session.user.id))
        )
      )
      .get();

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this content' }, { status: 400 });
    }

    // Create the report
    const newReport = await db
      .insert(reportedContent)
      .values({
        contentType: validatedData.contentType,
        contentId: validatedData.contentId,
        reporterId: Number(session.user.id),
        reason: validatedData.reason,
        description: validatedData.description,
      })
      .returning();

    return NextResponse.json({ success: true, report: newReport[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
