import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { 
  forumCategories, 
  forumPosts, 
  forumReplies, 
  socialPosts, 
  socialComments, 
  reportedContent,
  users 
} from '@/db/schema';
import { desc, eq, sql, count } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield,
  MessageSquare, 
  Users,
  Flag,
  Eye,
  Settings,
  Plus,
  Pin,
  Lock,
  AlertTriangle,
  TrendingUp,
  FileText,
  Activity,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTimeAgo } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UnifiedModerationPage() {
  const session = await getServerSession();

  // Verify moderator access (already checked in layout, but double-check)
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'moderator')) {
    redirect('/dashboard');
  }

  // === STATISTICS ===
  // Forum stats
  const [forumStats] = await db
    .select({
      totalCategories: count(forumCategories.id),
    })
    .from(forumCategories);

  const [postStats] = await db
    .select({
      totalForumPosts: count(forumPosts.id),
      totalForumReplies: count(forumReplies.id),
    })
    .from(forumPosts)
    .leftJoin(forumReplies, eq(forumReplies.postId, forumPosts.id));

  // Social stats
  const [socialStats] = await db
    .select({
      totalSocialPosts: count(socialPosts.id),
      totalSocialComments: count(socialComments.id),
    })
    .from(socialPosts)
    .leftJoin(socialComments, eq(socialComments.postId, socialPosts.id));

  // Reports stats
  const reportCounts = await db
    .select({
      status: reportedContent.status,
      count: count(),
    })
    .from(reportedContent)
    .groupBy(reportedContent.status);

  const pendingReports = reportCounts.find(r => r.status === 'pending')?.count || 0;
  const totalReports = reportCounts.reduce((sum, r) => sum + r.count, 0);

  // === RECENT CONTENT ===
  // Recent forum posts
  const recentForumPosts = await db
    .select({
      post: forumPosts,
      author: {
        id: users.id,
        username: users.username,
        role: users.role,
      },
      category: {
        name: forumCategories.name,
        slug: forumCategories.slug,
      },
    })
    .from(forumPosts)
    .innerJoin(users, eq(forumPosts.authorId, users.id))
    .innerJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .orderBy(desc(forumPosts.createdAt))
    .limit(5);

  // Recent social posts
  const recentSocialPosts = await db
    .select({
      post: socialPosts,
      author: {
        id: users.id,
        username: users.username,
        minecraftUsername: users.minecraftUsername,
        avatar: users.avatar,
        role: users.role,
      },
    })
    .from(socialPosts)
    .innerJoin(users, eq(socialPosts.userId, users.id))
    .orderBy(desc(socialPosts.createdAt))
    .limit(5);

  // Recent reports
  const recentReports = await db
    .select({
      id: reportedContent.id,
      contentType: reportedContent.contentType,
      reason: reportedContent.reason,
      status: reportedContent.status,
      createdAt: reportedContent.createdAt,
      reporter: {
        username: users.username,
      },
    })
    .from(reportedContent)
    .innerJoin(users, eq(reportedContent.reporterId, users.id))
    .orderBy(desc(reportedContent.createdAt))
    .limit(10);

  // Forum categories
  const categories = await db
    .select({
      id: forumCategories.id,
      name: forumCategories.name,
      slug: forumCategories.slug,
      icon: forumCategories.icon,
      postCount: sql<number>`count(${forumPosts.id})`.as('postCount'),
    })
    .from(forumCategories)
    .leftJoin(forumPosts, eq(forumPosts.categoryId, forumCategories.id))
    .groupBy(forumCategories.id)
    .orderBy(forumCategories.orderIndex)
    .limit(6);

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Shield className="h-6 w-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Moderation Dashboard</h1>
          </div>
          <p className="text-gray-400">
            Unified control center for forum, social, and content moderation
          </p>
        </div>
        {role === 'admin' && (
          <Link href="/admin">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Admin Panel
            </Button>
          </Link>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Flag className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingReports}</div>
            <p className="text-xs text-gray-400 mt-1">
              {totalReports} total reports
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forum Activity</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(postStats?.totalForumPosts || 0)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {postStats?.totalForumReplies || 0} replies
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Posts</CardTitle>
            <Activity className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {socialStats?.totalSocialPosts || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {socialStats?.totalSocialComments || 0} comments
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forum Categories</CardTitle>
            <FileText className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {forumStats?.totalCategories || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Active categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common moderation tasks and tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/moderation/reports" className="block">
              <Button 
                variant="outline" 
                className="w-full h-auto flex flex-col items-start p-4 hover:border-cyan-500/40 transition-all"
              >
                <Flag className="h-5 w-5 text-red-400 mb-2" />
                <div className="text-left">
                  <div className="font-semibold text-white">View Reports</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {pendingReports} pending
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/moderation/forum/categories/new" className="block">
              <Button 
                variant="outline" 
                className="w-full h-auto flex flex-col items-start p-4 hover:border-cyan-500/40 transition-all"
              >
                <Plus className="h-5 w-5 text-green-400 mb-2" />
                <div className="text-left">
                  <div className="font-semibold text-white">New Category</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Create forum category
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/forum" className="block">
              <Button 
                variant="outline" 
                className="w-full h-auto flex flex-col items-start p-4 hover:border-cyan-500/40 transition-all"
              >
                <MessageSquare className="h-5 w-5 text-blue-400 mb-2" />
                <div className="text-left">
                  <div className="font-semibold text-white">Browse Forum</div>
                  <div className="text-xs text-gray-400 mt-1">
                    View all posts
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/social" className="block">
              <Button 
                variant="outline" 
                className="w-full h-auto flex flex-col items-start p-4 hover:border-cyan-500/40 transition-all"
              >
                <Users className="h-5 w-5 text-purple-400 mb-2" />
                <div className="text-left">
                  <div className="font-semibold text-white">Browse Social</div>
                  <div className="text-xs text-gray-400 mt-1">
                    View all posts
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports">
            <Flag className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="forum">
            <MessageSquare className="h-4 w-4 mr-2" />
            Forum
          </TabsTrigger>
          <TabsTrigger value="social">
            <Activity className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Settings className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Recent Reports
              </CardTitle>
              <CardDescription>
                User-submitted content reports requiring review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentReports.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No reports to review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/moderation/reports/${report.id}`}
                      className="block p-4 glass border border-cyan-500/20 rounded-lg hover:border-cyan-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={
                              report.status === 'pending' ? 'text-yellow-400 border-yellow-400' :
                              report.status === 'actioned' ? 'text-green-400 border-green-400' :
                              'text-gray-400 border-gray-400'
                            }>
                              {report.status}
                            </Badge>
                            <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                              {report.contentType.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 mb-1">{report.reason}</p>
                          <div className="text-xs text-gray-500">
                            Reported by {report.reporter.username} • {formatTimeAgo(report.createdAt)}
                          </div>
                        </div>
                        <Eye className="h-4 w-4 text-cyan-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-white/10">
                <Link href="/moderation/reports">
                  <Button variant="outline" className="w-full">
                    View All Reports ({totalReports})
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forum Tab */}
        <TabsContent value="forum" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                Recent Forum Posts
              </CardTitle>
              <CardDescription>
                Latest forum posts across all categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentForumPosts.map((item) => (
                  <div
                    key={item.post.id}
                    className="flex items-start justify-between p-4 glass border border-cyan-500/20 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/forum/${item.category?.slug}/${item.post.id}`}
                            className="font-semibold text-white hover:text-cyan-400 transition-colors"
                          >
                            {item.post.title}
                          </Link>
                          {item.post.pinned && (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                              <Pin className="h-3 w-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                          {item.post.locked && (
                            <Badge variant="outline" className="text-gray-400 border-gray-400">
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        <div className="relative">
                          <button
                            className="p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/5"
                            aria-label="Post actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>by {item.author?.username}</span>
                        <span>in {item.category?.name}</span>
                        <span>{formatTimeAgo(item.post.createdAt)}</span>
                        <span>{item.post.views} views</span>
                      </div>
                    </div>
                    <Link href={`/forum/${item.category?.slug}/${item.post.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                Recent Social Posts
              </CardTitle>
              <CardDescription>
                Latest posts from the social feed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSocialPosts.map((item) => (
                  <div
                    key={item.post.id}
                    className="flex items-start gap-4 p-4 glass border border-cyan-500/20 rounded-lg"
                  >
                    <img
                      src={`https://mc-heads.net/head/${item.author.minecraftUsername || 'steve'}/32`}
                      alt={item.author.username}
                      className="w-8 h-8 rounded-lg pixelated"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">
                          {item.author.username}
                        </span>
                        {item.author.role && item.author.role !== 'user' && (
                          <Badge variant="outline" className={`text-xs ${
                            item.author.role === 'admin' ? 'text-red-400 border-red-400' :
                            'text-cyan-400 border-cyan-400'
                          }`}>
                            {item.author.role}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(item.post.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2">{item.post.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-green-400" />
                  Forum Categories
                </CardTitle>
                <CardDescription>
                  Manage forum categories and structure
                </CardDescription>
              </div>
              <Link href="/moderation/forum/categories/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Category
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-4 glass border border-cyan-500/20 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{cat.icon || '📁'}</div>
                      <div>
                        <h3 className="font-semibold text-white">{cat.name}</h3>
                        <p className="text-sm text-gray-400">{cat.postCount} posts</p>
                      </div>
                    </div>
                    <Link href={`/moderation/forum/categories/${cat.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
