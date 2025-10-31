import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { 
  reportedContent, 
  users, 
  socialPosts, 
  forumPosts, 
  forumReplies, 
  groupPosts, 
  groupPostComments, 
  socialComments,
  groups
} from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

/**
 * GET /api/admin/reports - Get all reported content with pagination
 * Query params:
 * - page: number (default: 1)
 * - limit: number (10-200, increments of 10)
 * - status: 'pending' | 'reviewed' | 'dismissed' | 'actioned' | 'all'
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const statusFilter = searchParams.get('status') || 'pending';
    
    // Validate limit (must be multiple of 10 between 10 and 200)
    const validLimits = Array.from({ length: 20 }, (_, i) => (i + 1) * 10);
    const limit = validLimits.includes(limitParam) ? limitParam : 20;
    
    const offset = (page - 1) * limit;

    // Build where clause for status filter
    let whereClause = undefined;
    if (statusFilter !== 'all') {
      whereClause = eq(reportedContent.status, statusFilter as any);
    }

    // Get reports with reporter info
    const reports = await db
      .select({
        id: reportedContent.id,
        contentType: reportedContent.contentType,
        contentId: reportedContent.contentId,
        reason: reportedContent.reason,
        description: reportedContent.description,
        status: reportedContent.status,
        reviewNotes: reportedContent.reviewNotes,
        reviewedAt: reportedContent.reviewedAt,
        createdAt: reportedContent.createdAt,
        reporter: {
          id: users.id,
          username: users.username,
          minecraftUsername: users.minecraftUsername,
          avatar: users.avatar,
          role: users.role,
        },
      })
      .from(reportedContent)
      .innerJoin(users, eq(reportedContent.reporterId, users.id))
      .where(whereClause)
      .orderBy(desc(reportedContent.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch content details for each report
    const reportsWithContent = await Promise.all(
      reports.map(async (report) => {
        let content: any = null;
        
        switch (report.contentType) {
          case 'social_post':
            const socialPost = await db
              .select({
                id: socialPosts.id,
                content: socialPosts.content,
                imageUrl: socialPosts.imageUrl,
                createdAt: socialPosts.createdAt,
                author: {
                  id: users.id,
                  username: users.username,
                  minecraftUsername: users.minecraftUsername,
                },
              })
              .from(socialPosts)
              .innerJoin(users, eq(socialPosts.userId, users.id))
              .where(eq(socialPosts.id, report.contentId))
              .get();
            content = socialPost;
            break;
            
          case 'forum_post':
            const forumPost = await db
              .select({
                id: forumPosts.id,
                title: forumPosts.title,
                content: forumPosts.content,
                createdAt: forumPosts.createdAt,
                author: {
                  id: users.id,
                  username: users.username,
                  minecraftUsername: users.minecraftUsername,
                },
              })
              .from(forumPosts)
              .innerJoin(users, eq(forumPosts.authorId, users.id))
              .where(eq(forumPosts.id, report.contentId))
              .get();
            content = forumPost;
            break;
            
          case 'forum_reply':
            const forumReply = await db
              .select({
                id: forumReplies.id,
                content: forumReplies.content,
                createdAt: forumReplies.createdAt,
                author: {
                  id: users.id,
                  username: users.username,
                  minecraftUsername: users.minecraftUsername,
                },
              })
              .from(forumReplies)
              .innerJoin(users, eq(forumReplies.authorId, users.id))
              .where(eq(forumReplies.id, report.contentId))
              .get();
            content = forumReply;
            break;
            
          case 'group_post':
            const groupPost = await db
              .select({
                id: groupPosts.id,
                content: groupPosts.content,
                imageUrl: groupPosts.imageUrl,
                createdAt: groupPosts.createdAt,
                groupName: groups.name,
                author: {
                  id: users.id,
                  username: users.username,
                  minecraftUsername: users.minecraftUsername,
                },
              })
              .from(groupPosts)
              .innerJoin(users, eq(groupPosts.userId, users.id))
              .innerJoin(groups, eq(groupPosts.groupId, groups.id))
              .where(eq(groupPosts.id, report.contentId))
              .get();
            content = groupPost;
            break;
            
          case 'group_comment':
            const groupComment = await db
              .select({
                id: groupPostComments.id,
                content: groupPostComments.content,
                createdAt: groupPostComments.createdAt,
                author: {
                  id: users.id,
                  username: users.username,
                  minecraftUsername: users.minecraftUsername,
                },
              })
              .from(groupPostComments)
              .innerJoin(users, eq(groupPostComments.userId, users.id))
              .where(eq(groupPostComments.id, report.contentId))
              .get();
            content = groupComment;
            break;
            
          case 'social_comment':
            const socialComment = await db
              .select({
                id: socialComments.id,
                content: socialComments.content,
                createdAt: socialComments.createdAt,
                author: {
                  id: users.id,
                  username: users.username,
                  minecraftUsername: users.minecraftUsername,
                },
              })
              .from(socialComments)
              .innerJoin(users, eq(socialComments.userId, users.id))
              .where(eq(socialComments.id, report.contentId))
              .get();
            content = socialComment;
            break;
        }

        return {
          ...report,
          content,
        };
      })
    );

    // Get total count for pagination
    const totalQuery = whereClause
      ? await db.select({ count: sql`count(*)` }).from(reportedContent).where(whereClause)
      : await db.select({ count: sql`count(*)` }).from(reportedContent);
    
    const total = Number(totalQuery[0].count);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      reports: reportsWithContent,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
