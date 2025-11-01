import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { reportedContent, users, forumPosts, socialPosts, groupPosts, forumReplies, socialComments, groupPostComments } from '@/db/schema';
import { desc, eq, sql, count } from 'drizzle-orm';

// GET /api/moderation/reports - Get reports for moderators
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const role = (session?.user as any)?.role;

    if (!session || (role !== 'admin' && role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db
      .select({
        report: reportedContent,
        reporter: {
          id: users.id,
          username: users.username,
          minecraftUsername: users.minecraftUsername,
          avatar: users.avatar,
        },
      })
      .from(reportedContent)
      .innerJoin(users, eq(reportedContent.reporterId, users.id));

    if (status && status !== 'all') {
      query = query.where(eq(reportedContent.status, status));
    }

    const reports = await query
      .orderBy(desc(reportedContent.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(reportedContent)
      .where(status && status !== 'all' ? eq(reportedContent.status, status) : undefined);

    return NextResponse.json({
      reports,
      total: totalResult.count,
      page: Math.floor(offset / limit) + 1,
      pages: Math.ceil(totalResult.count / limit),
    });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// PATCH /api/moderation/reports/[id] - Update report status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    const role = (session?.user as any)?.role;

    if (!session || (role !== 'admin' && role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { status, action, notes } = body;

    if (!status || !['pending', 'reviewed', 'actioned', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const url = new URL(request.url);
    const reportId = parseInt(url.pathname.split('/').pop() || '');
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const [updatedReport] = await db
      .update(reportedContent)
      .set({
        status,
        reviewNotes: notes,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      })
      .where(eq(reportedContent.id, reportId))
      .returning();

    if (!updatedReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Failed to update report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}
