import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc, sql, count } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Users, Shield, UserCog, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo } from '@/lib/date-utils';

export default async function ModeratorUsersPage() {
  const session = await getServerSession();
  const role = (session?.user as any)?.role;

  if (!session || (role !== 'admin' && role !== 'moderator')) {
    redirect('/dashboard');
  }

  // Get user statistics
  const [userStats] = await db
    .select({
      total: count(),
      admins: sql<number>`count(CASE WHEN role = 'admin' THEN 1 END)`,
      moderators: sql<number>`count(CASE WHEN role = 'moderator' THEN 1 END)`,
      users: sql<number>`count(CASE WHEN role = 'user' THEN 1 END)`,
    })
    .from(users);

  // Get recent users
  const recentUsers = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      minecraftUsername: users.minecraftUsername,
      avatar: users.avatar,
      role: users.role,
      level: users.level,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(10);

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">View user accounts and activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userStats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userStats.admins}</div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderators</CardTitle>
            <UserCog className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userStats.moderators}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userStats.users}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Latest registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 glass border border-cyan-500/20 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={`https://mc-heads.net/head/${user.minecraftUsername || 'steve'}/32`}
                    alt={user.username}
                    className="w-10 h-10 rounded-lg pixelated"
                  />
                  <div>
                    <p className="font-semibold text-white">{user.username}</p>
                    <p className="text-sm text-gray-400">{user.minecraftUsername}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant="outline" 
                    className={
                      user.role === 'admin' ? 'text-red-400 border-red-400' :
                      user.role === 'moderator' ? 'text-cyan-400 border-cyan-400' :
                      'text-blue-400 border-blue-400'
                    }
                  >
                    {user.role}
                  </Badge>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    Level {user.level}
                  </Badge>
                  <div className="text-sm text-gray-400">
                    {formatTimeAgo(user.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
