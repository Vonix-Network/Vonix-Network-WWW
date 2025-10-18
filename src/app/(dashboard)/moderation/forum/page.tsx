import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { forumCategories, forumPosts, forumReplies, users } from '@/db/schema';
import { desc, eq, sql, count } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Settings, 
  Plus, 
  MessageSquare, 
  Pin, 
  Lock, 
  Eye,
  Users,
  Flag,
  Trash2,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo } from '@/lib/date-utils';

export default async function ForumModerationPage() {
  const session = await getServerSession();

  // Check if user is admin or moderator
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
    redirect('/');
  }

  // Get forum statistics
  const [stats] = await db
    .select({
      totalCategories: count(forumCategories.id),
      totalPosts: count(forumPosts.id),
      totalReplies: count(forumReplies.id),
    })
    .from(forumCategories)
    .leftJoin(forumPosts, eq(forumPosts.categoryId, forumCategories.id))
    .leftJoin(forumReplies, eq(forumReplies.postId, forumPosts.id));

  // Get categories with post counts
  const categories = await db
    .select({
      id: forumCategories.id,
      name: forumCategories.name,
      description: forumCategories.description,
      slug: forumCategories.slug,
      icon: forumCategories.icon,
      orderIndex: forumCategories.orderIndex,
      createdAt: forumCategories.createdAt,
      postCount: sql<number>`count(${forumPosts.id})`.as('postCount'),
    })
    .from(forumCategories)
    .leftJoin(forumPosts, eq(forumPosts.categoryId, forumCategories.id))
    .groupBy(forumCategories.id)
    .orderBy(forumCategories.orderIndex);

  // Get recent posts for moderation
  const recentPosts = await db
    .select({
      post: forumPosts,
      author: {
        id: users.id,
        username: users.username,
        minecraftUsername: users.minecraftUsername,
        avatar: users.avatar,
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
    .limit(10);

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Forum Moderation</h1>
          <p className="text-gray-400 mt-2">Manage forum categories, permissions, and content</p>
        </div>
        <Link href="/moderation/forum/categories/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalCategories || 0}</div>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Total Replies</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalReplies || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Category Management
          </CardTitle>
          <CardDescription>
            Manage forum categories and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 glass border border-green-500/20 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{item.icon || '📁'}</div>
                  <div>
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{item.postCount}</div>
                    <div className="text-xs text-gray-500">Posts</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/moderation/forum/categories/${item.id}/edit`}>
                      <Button variant="ghost" size="icon" title="Edit Category">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts for Moderation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Recent Posts
          </CardTitle>
          <CardDescription>
            Recent forum posts that may need moderation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.map((item) => (
              <div
                key={item.post.id}
                className="flex items-start justify-between p-4 glass border border-green-500/20 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/forum/${item.category?.slug}/${item.post.id}`}
                      className="font-semibold text-white hover:text-green-400 transition-colors"
                    >
                      {item.post.title}
                    </Link>
                    {item.post.pinned && (
                      <Badge variant="outline" className="text-green-400 border-green-400">
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
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>by {item.author?.username}</span>
                    <span>in {item.category?.name}</span>
                    <span>{formatTimeAgo(item.post.createdAt)}</span>
                    <span>{item.post.views} views</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/forum/${item.category?.slug}/${item.post.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
