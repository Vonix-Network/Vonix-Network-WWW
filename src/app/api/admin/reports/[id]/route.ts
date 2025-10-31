import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { reportedContent, socialPosts, forumPosts, forumReplies, groupPosts, groupPostComments, socialComments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateReportSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'dismissed', 'actioned']),
  reviewNotes: z.string().max(1000).optional(),
  deleteContent: z.boolean().optional(), // If actioned, should we delete the content?
});

/**
 * PATCH /api/admin/reports/[id] - Update report status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const reportId = parseInt(resolvedParams.id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    // Get the report
    const report = await db
      .select()
      .from(reportedContent)
      .where(eq(reportedContent.id, reportId))
      .get();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = updateReportSchema.parse(body);

    // If actioned and deleteContent is true, delete the reported content
    if (validatedData.status === 'actioned' && validatedData.deleteContent) {
      switch (report.contentType) {
        case 'social_post':
          await db.delete(socialPosts).where(eq(socialPosts.id, report.contentId));
          break;
        case 'forum_post':
          await db.delete(forumPosts).where(eq(forumPosts.id, report.contentId));
          break;
        case 'forum_reply':
          await db.delete(forumReplies).where(eq(forumReplies.id, report.contentId));
          break;
        case 'group_post':
          await db.delete(groupPosts).where(eq(groupPosts.id, report.contentId));
          break;
        case 'group_comment':
          await db.delete(groupPostComments).where(eq(groupPostComments.id, report.contentId));
          break;
        case 'social_comment':
          await db.delete(socialComments).where(eq(socialComments.id, report.contentId));
          break;
      }
    }

    // Update the report
    const updatedReport = await db
      .update(reportedContent)
      .set({
        status: validatedData.status,
        reviewNotes: validatedData.reviewNotes,
        reviewedBy: Number(session.user.id),
        reviewedAt: new Date(),
      })
      .where(eq(reportedContent.id, reportId))
      .returning();

    return NextResponse.json(updatedReport[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/reports/[id] - Delete a report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const resolvedParams = await params;
    const reportId = parseInt(resolvedParams.id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    await db.delete(reportedContent).where(eq(reportedContent.id, reportId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
