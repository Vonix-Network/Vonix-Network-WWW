import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { reportedContent, users, forumPosts, socialPosts, groupPosts, forumReplies, socialComments, groupPostComments } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Flag, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Trash2,
  MessageSquare,
  User,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatTimeAgo } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ReportAction {
  status: 'reviewed' | 'actioned' | 'dismissed';
  action: string;
  notes?: string;
}

export default async function ModeratorReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession();
  const role = (session?.user as any)?.role;

  if (!session || (role !== 'admin' && role !== 'moderator')) {
    redirect('/dashboard');
  }

  const reportId = parseInt(params.id);
  if (isNaN(reportId)) {
    notFound();
  }

  // Get report details
  const [reportData] = await db
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
    .innerJoin(users, eq(reportedContent.reporterId, users.id))
    .where(eq(reportedContent.id, reportId))
    .limit(1);

  if (!reportData) {
    notFound();
  }

  const { report, reporter } = reportData;

  // Get reported content details
  let content: any = null;
  let contentTypeLabel = '';

  switch (report.contentType) {
    case 'forum_post':
      const [forumPost] = await db
        .select({
          id: forumPosts.id,
          title: forumPosts.title,
          content: forumPosts.content,
          createdAt: forumPosts.createdAt,
          author: users.username,
          authorId: forumPosts.authorId,
          category: sql`(
            SELECT name FROM forum_categories fc 
            WHERE fc.id = ${forumPosts.categoryId}
          )`,
        })
        .from(forumPosts)
        .innerJoin(users, eq(forumPosts.authorId, users.id))
        .where(eq(forumPosts.id, report.contentId))
        .limit(1);
      content = forumPost;
      contentTypeLabel = 'Forum Post';
      break;

    case 'social_post':
      const [socialPost] = await db
        .select({
          id: socialPosts.id,
          content: socialPosts.content,
          imageUrl: socialPosts.imageUrl,
          createdAt: socialPosts.createdAt,
          author: users.username,
          authorId: socialPosts.userId,
        })
        .from(socialPosts)
        .innerJoin(users, eq(socialPosts.userId, users.id))
        .where(eq(socialPosts.id, report.contentId))
        .limit(1);
      content = socialPost;
      contentTypeLabel = 'Social Post';
      break;

    case 'group_post':
      const [groupPost] = await db
        .select({
          id: groupPosts.id,
          content: groupPosts.content,
          imageUrl: groupPosts.imageUrl,
          createdAt: groupPosts.createdAt,
          author: users.username,
          authorId: groupPosts.userId,
        })
        .from(groupPosts)
        .innerJoin(users, eq(groupPosts.userId, users.id))
        .where(eq(groupPosts.id, report.contentId))
        .limit(1);
      content = groupPost;
      contentTypeLabel = 'Group Post';
      break;

    case 'forum_reply':
      const [forumReply] = await db
        .select({
          id: forumReplies.id,
          content: forumReplies.content,
          createdAt: forumReplies.createdAt,
          author: users.username,
          authorId: forumReplies.authorId,
        })
        .from(forumReplies)
        .innerJoin(users, eq(forumReplies.authorId, users.id))
        .where(eq(forumReplies.id, report.contentId))
        .limit(1);
      content = forumReply;
      contentTypeLabel = 'Forum Reply';
      break;

    case 'social_comment':
      const [socialComment] = await db
        .select({
          id: socialComments.id,
          content: socialComments.content,
          createdAt: socialComments.createdAt,
          author: users.username,
          authorId: socialComments.userId,
        })
        .from(socialComments)
        .innerJoin(users, eq(socialComments.userId, users.id))
        .where(eq(socialComments.id, report.contentId))
        .limit(1);
      content = socialComment;
      contentTypeLabel = 'Social Comment';
      break;

    case 'group_comment':
      const [groupComment] = await db
        .select({
          id: groupPostComments.id,
          content: groupPostComments.content,
          createdAt: groupPostComments.createdAt,
          author: users.username,
          authorId: groupPostComments.userId,
        })
        .from(groupPostComments)
        .innerJoin(users, eq(groupPostComments.userId, users.id))
        .where(eq(groupPostComments.id, report.contentId))
        .limit(1);
      content = groupComment;
      contentTypeLabel = 'Group Comment';
      break;
  }

  if (!content) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 fade-in-up">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold text-white mb-2">Content Not Found</h1>
          <p className="text-gray-400">The reported content may have been deleted.</p>
          <Link href="/moderation/reports">
            <Button variant="outline" className="mt-4">
              Back to Reports
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Flag className="h-6 w-6 text-red-400" />
            <h1 className="text-3xl font-bold text-white">Report #{report.id}</h1>
          </div>
          <p className="text-gray-400">
            Review and take action on reported content
          </p>
        </div>
        <Link href="/moderation/reports">
          <Button variant="outline">Back to Reports</Button>
        </Link>
      </div>

      {/* Report Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Badge 
                  variant="outline" 
                  className={
                    report.status === 'pending' ? 'text-yellow-400 border-yellow-400' :
                    report.status === 'reviewed' ? 'text-blue-400 border-blue-400' :
                    report.status === 'actioned' ? 'text-green-400 border-green-400' :
                    'text-gray-400 border-gray-400'
                  }
                >
                  {report.status}
                </Badge>
              </div>

              <div>
                <Label>Content Type</Label>
                <p className="text-sm text-gray-300">{contentTypeLabel}</p>
              </div>

              <div>
                <Label>Reason</Label>
                <p className="text-sm text-gray-300">{report.reason}</p>
              </div>

              {report.description && (
                <div>
                  <Label>Additional Details</Label>
                  <p className="text-sm text-gray-300">{report.description}</p>
                </div>
              )}

              <div>
                <Label>Reported By</Label>
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={`https://mc-heads.net/head/${reporter.minecraftUsername || 'steve'}/32`}
                    alt={reporter.username}
                    className="w-6 h-6 rounded-lg pixelated"
                  />
                  <span className="text-sm text-gray-300">{reporter.username}</span>
                </div>
              </div>

              <div>
                <Label>Reported At</Label>
                <p className="text-sm text-gray-300">{formatTimeAgo(report.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Content Preview
              </CardTitle>
              <CardDescription>
                The reported content for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Author</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <img
                      src={`https://mc-heads.net/head/${content.author || 'steve'}/32`}
                      alt={content.author}
                      className="w-8 h-8 rounded-lg pixelated"
                    />
                    <span className="text-sm text-gray-300">{content.author}</span>
                    <span className="text-xs text-gray-500">• {formatTimeAgo(content.createdAt)}</span>
                  </div>
                </div>

                {content.title && (
                  <div>
                    <Label>Title</Label>
                    <p className="text-sm text-gray-300 font-medium">{content.title}</p>
                  </div>
                )}

                <div>
                  <Label>Content</Label>
                  <div className="mt-2 p-4 bg-gray-800/50 rounded-lg border border-white/10">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {content.content || content.title}
                    </p>
                    {content.imageUrl && (
                      <div className="mt-3">
                        <img
                          src={content.imageUrl}
                          alt="Reported content"
                          className="max-w-full h-auto rounded-lg max-h-64"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {content.category && (
                  <div>
                    <Label>Category</Label>
                    <p className="text-sm text-gray-300">{content.category}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Actions</CardTitle>
          <CardDescription>
            Choose an appropriate action for this report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div>
              <Label htmlFor="action">Action</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 justify-start p-4 h-auto text-blue-400 border-blue-400 hover:bg-blue-400/10"
                >
                  <Eye className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">Mark Reviewed</div>
                    <div className="text-xs text-gray-400">No action needed</div>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 justify-start p-4 h-auto text-green-400 border-green-400 hover:bg-green-400/10"
                >
                  <CheckCircle className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">Take Action</div>
                    <div className="text-xs text-gray-400">Remove content</div>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 justify-start p-4 h-auto text-gray-400 border-gray-400 hover:bg-gray-400/10"
                >
                  <XCircle className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">Dismiss</div>
                    <div className="text-xs text-gray-400">Invalid report</div>
                  </div>
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about your decision..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="button" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Content
              </Button>
              <Button type="button" variant="outline">
                Warn User
              </Button>
              <Button type="button" variant="default">
                Submit Action
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
