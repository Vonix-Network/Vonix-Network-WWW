import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { reportedContent, users, forumPosts, socialPosts, groupPosts, forumReplies, socialComments, groupPostComments } from '@/db/schema';
import { desc, eq, sql, count } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Flag, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  MessageSquare,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTimeAgo } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ModeratorReportsPage() {
  const session = await getServerSession();
  const role = (session?.user as any)?.role;

  if (!session || (role !== 'admin' && role !== 'moderator')) {
    redirect('/dashboard');
  }

  // Get reports statistics
  const reportStats = await db
    .select({
      status: reportedContent.status,
      count: count(),
    })
    .from(reportedContent)
    .groupBy(reportedContent.status);

  const pendingCount = reportStats.find(r => r.status === 'pending')?.count || 0;
  const reviewedCount = reportStats.find(r => r.status === 'reviewed')?.count || 0;
  const actionedCount = reportStats.find(r => r.status === 'actioned')?.count || 0;
  const dismissedCount = reportStats.find(r => r.status === 'dismissed')?.count || 0;

  // Get recent reports with content details
  const recentReports = await db
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
    .orderBy(desc(reportedContent.createdAt))
    .limit(20);

  // Helper to get content preview
  async function getContentPreview(contentType: string, contentId: number) {
    let content;
    let contentTypeLabel;

    switch (contentType) {
      case 'forum_post':
        const [forumPost] = await db
          .select({
            title: forumPosts.title,
            content: forumPosts.content,
            author: users.username,
          })
          .from(forumPosts)
          .innerJoin(users, eq(forumPosts.authorId, users.id))
          .where(eq(forumPosts.id, contentId))
          .limit(1);
        content = forumPost;
        contentTypeLabel = 'Forum Post';
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
          .where(eq(forumReplies.id, contentId))
          .limit(1);
        content = forumReply;
        contentTypeLabel = 'Forum Reply';
        break;

      case 'social_post':
        const [socialPost] = await db
          .select({
            content: socialPosts.content,
            author: users.username,
          })
          .from(socialPosts)
          .innerJoin(users, eq(socialPosts.userId, users.id))
          .where(eq(socialPosts.id, contentId))
          .limit(1);
        content = socialPost;
        contentTypeLabel = 'Social Post';
        break;

      case 'group_post':
        const [groupPost] = await db
          .select({
            content: groupPosts.content,
            author: users.username,
          })
          .from(groupPosts)
          .innerJoin(users, eq(groupPosts.userId, users.id))
          .where(eq(groupPosts.id, contentId))
          .limit(1);
        content = groupPost;
        contentTypeLabel = 'Group Post';
        break;

      default:
        return { content: null, contentTypeLabel: 'Unknown' };
    }

    return { content, contentTypeLabel };
  }

  // Get content previews for reports
  const reportsWithContent = await Promise.all(
    recentReports.map(async ({ report, reporter }) => {
      const { content, contentTypeLabel } = await getContentPreview(report.contentType, report.contentId);
      return { report, reporter, content, contentTypeLabel };
    })
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Moderator Reports</h1>
          <p className="text-gray-400 mt-1">Review and manage user-submitted reports</p>
        </div>
        <div className="text-sm text-gray-400">
          Total Reports: {pendingCount + reviewedCount + actionedCount + dismissedCount}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <Eye className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{reviewedCount}</div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actioned</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{actionedCount}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dismissed</CardTitle>
            <XCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{dismissedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Recent Reports
          </CardTitle>
          <CardDescription>
            User-submitted reports requiring moderator attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsWithContent.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No reports to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportsWithContent.map(({ report, reporter, content, contentTypeLabel }) => (
                <div
                  key={report.id}
                  className="p-4 glass border border-cyan-500/20 rounded-lg hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
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
                        <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                          {contentTypeLabel}
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <p className="text-sm font-medium text-white">{report.reason}</p>
                        {report.description && (
                          <p className="text-sm text-gray-400 mt-1">{report.description}</p>
                        )}
                      </div>

                      {content && (
                        <div className="mb-2 p-3 bg-gray-800/50 rounded-lg border-l-2 border-cyan-500/30">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">Content preview:</span>
                            <span className="text-xs text-gray-400">by {content.author}</span>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2">
                            {content.content}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Reported by {reporter.username}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(report.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/moderation/reports/${report.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
