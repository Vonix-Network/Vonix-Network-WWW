import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { socialPosts, socialComments, users } from '@/db/schema';
import { desc, eq, sql, count } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, 
  Users,
  Flag,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatTimeAgo } from '@/lib/date-utils';

export default async function SocialModerationPage() {
  const session = await getServerSession();

  // Check if user is admin or moderator
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
    redirect('/');
  }

  // Get social statistics
  const [stats] = await db
    .select({
      totalPosts: count(socialPosts.id),
      totalComments: count(socialComments.id),
    })
    .from(socialPosts)
    .leftJoin(socialComments, eq(socialComments.postId, socialPosts.id));

  // Get recent posts for moderation
  const recentPosts = await db
    .select({
      post: socialPosts,
      author: {
        id: users.id,
        username: users.username,
        minecraftUsername: users.minecraftUsername,
        avatar: users.avatar,
        role: users.role,
      },
      commentsCount: sql<number>`count(${socialComments.id})`.as('commentsCount'),
    })
    .from(socialPosts)
    .innerJoin(users, eq(socialPosts.userId, users.id))
    .leftJoin(socialComments, eq(socialComments.postId, socialPosts.id))
    .groupBy(socialPosts.id)
    .orderBy(desc(socialPosts.createdAt))
    .limit(15);

  // Get recent comments for moderation
  const recentComments = await db
    .select({
      comment: {
        id: socialComments.id,
        content: socialComments.content,
        createdAt: socialComments.createdAt,
      },
      author: {
        id: users.id,
        username: users.username,
        minecraftUsername: users.minecraftUsername,
        avatar: users.avatar,
        role: users.role,
      },
      post: {
        id: socialPosts.id,
        content: socialPosts.content,
      },
    })
    .from(socialComments)
    .innerJoin(users, eq(socialComments.userId, users.id))
    .innerJoin(socialPosts, eq(socialComments.postId, socialPosts.id))
    .orderBy(desc(socialComments.createdAt))
    .limit(10);

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Social Moderation</h1>
          <p className="text-gray-400 mt-2">Manage social posts, comments, and user interactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/moderation/forum">
            <Button variant="outline">Forum Moderation</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalPosts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalComments || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts for Moderation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Posts
          </CardTitle>
          <CardDescription>
            Recent social posts that may need moderation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.map((item) => (
              <div
                key={item.post.id}
                className="flex items-start gap-4 p-4 glass border border-green-500/20 rounded-lg"
              >
                <Avatar
                  username={item.author?.username || 'Unknown'}
                  minecraftUsername={item.author?.minecraftUsername}
                  avatar={item.author?.avatar}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">{item.author?.username}</span>
                    {item.author?.role && item.author.role !== 'user' && (
                      <Badge variant="outline" className={`text-xs ${
                        item.author.role === 'admin' ? 'text-red-400 border-red-400' :
                        'text-blue-400 border-blue-400'
                      }`}>
                        {item.author.role}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500">
                      {formatTimeAgo(item.post.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2 line-clamp-3">{item.post.content}</p>
                  {item.post.imageUrl && (
                    <div className="mb-2">
                      <img
                        src={item.post.imageUrl}
                        alt="Post image"
                        className="max-w-xs rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{item.commentsCount} comments</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" title="View Post">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Hide Post" className="text-orange-400">
                    <EyeOff className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Delete Post" className="text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Comments for Moderation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Comments
          </CardTitle>
          <CardDescription>
            Recent comments that may need moderation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentComments.map((item) => (
              <div
                key={item.comment.id}
                className="flex items-start gap-4 p-4 glass border border-green-500/20 rounded-lg"
              >
                <Avatar
                  username={item.author?.username || 'Unknown'}
                  minecraftUsername={item.author?.minecraftUsername}
                  avatar={item.author?.avatar}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white text-sm">{item.author?.username}</span>
                    {item.author?.role && item.author.role !== 'user' && (
                      <Badge variant="outline" className={`text-xs ${
                        item.author.role === 'admin' ? 'text-red-400 border-red-400' :
                        'text-blue-400 border-blue-400'
                      }`}>
                        {item.author.role}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(item.comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{item.comment.content}</p>
                  <div className="text-xs text-gray-500 bg-gray-800/50 p-2 rounded border-l-2 border-green-500/30">
                    <span className="text-gray-400">Replying to:</span> {item.post?.content?.substring(0, 100)}...
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" title="Hide Comment" className="text-orange-400">
                    <EyeOff className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Delete Comment" className="text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common moderation actions and tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center gap-2 justify-start p-4 h-auto">
              <Flag className="h-5 w-5 text-red-400" />
              <div className="text-left">
                <div className="font-semibold">View Reports</div>
                <div className="text-sm text-gray-400">Review user reports</div>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2 justify-start p-4 h-auto">
              <Users className="h-5 w-5 text-blue-400" />
              <div className="text-left">
                <div className="font-semibold">User Management</div>
                <div className="text-sm text-gray-400">Manage user roles</div>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2 justify-start p-4 h-auto">
              <MessageSquare className="h-5 w-5 text-green-400" />
              <div className="text-left">
                <div className="font-semibold">Content Analytics</div>
                <div className="text-sm text-gray-400">View engagement stats</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
