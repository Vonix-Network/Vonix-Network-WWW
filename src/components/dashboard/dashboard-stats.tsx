import { db } from '@/db';
import { socialPosts, forumPosts, privateMessages, users, donationRanks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { Users, MessageSquare, FileText, Mail, Crown, Calendar } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';

interface DashboardStatsProps {
  session: any;
}

export async function DashboardStats({ session }: DashboardStatsProps) {
  // Force no caching - always fetch fresh data
  noStore();
  
  // Fetch user stats
  const userPosts = await db.query.socialPosts.findMany({
    where: eq(socialPosts.userId, parseInt(session.user.id)),
    limit: 5,
  });

  const userForumPosts = await db.query.forumPosts.findMany({
    where: eq(forumPosts.authorId, parseInt(session.user.id)),
    limit: 5,
  });

  const unreadMessages = await db.query.privateMessages.findMany({
    where: and(
      eq(privateMessages.recipientId, parseInt(session.user.id)),
      eq(privateMessages.read, false)
    ),
  });

  // Fetch user's donation rank
  const [userData] = await db
    .select({
      donationRankId: users.donationRankId,
      rankExpiresAt: users.rankExpiresAt,
      totalDonated: users.totalDonated,
    })
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)));

  let userRank = null;
  if (userData?.donationRankId) {
    const [rank] = await db
      .select()
      .from(donationRanks)
      .where(eq(donationRanks.id, userData.donationRankId));
    userRank = rank;
  }

  return (
    <>
      {/* User Rank Display */}
      {userRank && (
        <div className="col-span-full glass border border-blue-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3" style={{
            backgroundColor: userRank.color + '20',
            border: `2px solid ${userRank.color}40`,
            borderRadius: '12px',
            padding: '16px',
          }}>
            <Crown className="h-5 w-5" style={{ color: userRank.color }} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: userRank.textColor !== '#000000' ? userRank.textColor : '#ffffff' }}>
                  {userRank.badge || userRank.name}
                </span>
                {userData?.rankExpiresAt && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expires: {new Date(typeof userData.rankExpiresAt === 'number' ? userData.rankExpiresAt * 1000 : userData.rankExpiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                Total Donated: ${userData?.totalDonated?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Social Posts"
          value={userPosts.length}
          icon={<FileText className="h-6 w-6" />}
          link="/social"
        />
        <StatCard
          title="Forum Topics"
          value={userForumPosts.length}
          icon={<MessageSquare className="h-6 w-6" />}
          link="/forum"
        />
        <StatCard
          title="Unread Messages"
          value={unreadMessages.length}
          icon={<Mail className="h-6 w-6" />}
          link="/messages"
        />
        <StatCard
          title="Friends"
          value={0}
          icon={<Users className="h-6 w-6" />}
          link="/friends"
        />
      </div>
    </>
  );
}

function StatCard({
  title,
  value,
  icon,
  link,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  link: string;
}) {
  return (
    <a
      href={link}
      className="group glass border border-blue-500/20 rounded-2xl p-6 hover-lift hover:border-blue-500/40 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        <div className="text-blue-400 group-hover:scale-110 transition-transform">{icon}</div>
      </div>
      <p className="text-4xl font-bold text-white">{value}</p>
      <div className="mt-2 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
        View all →
      </div>
    </a>
  );
}
