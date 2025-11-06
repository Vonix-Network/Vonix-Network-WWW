import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { donationRanks, users } from '@/db/schema';
import { DonorRanksClient } from '@/components/admin/donor-ranks-client';
import { Crown, Users, TrendingUp, DollarSign, Sparkles } from 'lucide-react';
import { sql } from 'drizzle-orm';
import { Card, CardContent } from '@/components/ui/card';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function DonorRanksPage() {
  await requireAdmin();

  // Get all donor ranks
  const ranks = await db.select().from(donationRanks);

  // Get count of users per rank
  const userCounts = await db
    .select({
      rankId: users.donationRankId,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .where(sql`${users.donationRankId} IS NOT NULL`)
    .groupBy(users.donationRankId);

  const countsMap = new Map(userCounts.map(c => [c.rankId, Number(c.count)]));

  const ranksWithCounts = ranks.map(rank => ({
    ...rank,
    userCount: countsMap.get(rank.id) || 0,
  }));

  // Calculate stats
  const totalUsers = Array.from(countsMap.values()).reduce((a, b) => a + b, 0);
  const totalRevenue = ranksWithCounts.reduce((sum, rank) => sum + (rank.minAmount * rank.userCount), 0);
  const avgPerRank = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl"></div>
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full mb-6">
              <Crown className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Admin Panel</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Donor Rank
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Management</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Create and manage donation ranks, configure pricing, and track user subscriptions
            </p>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-purple-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-cyan-500/20 p-2 rounded-lg">
                      <Crown className="h-5 w-5 text-cyan-400" />
                    </div>
                    <p className="text-sm text-gray-400">Total Ranks</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{ranks.length}</p>
                </CardContent>
              </Card>

              <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <Users className="h-5 w-5 text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-400">Active Users</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{totalUsers}</p>
                </CardContent>
              </Card>

              <Card className="border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-orange-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-pink-500/20 p-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-pink-400" />
                    </div>
                    <p className="text-sm text-gray-400">Total Revenue</p>
                  </div>
                  <p className="text-3xl font-bold text-white">${totalRevenue.toFixed(0)}</p>
                </CardContent>
              </Card>

              <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-cyan-500/20 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-cyan-400" />
                    </div>
                    <p className="text-sm text-gray-400">Avg Per User</p>
                  </div>
                  <p className="text-3xl font-bold text-white">${avgPerRank}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <DonorRanksClient initialRanks={ranksWithCounts} />
        </div>
      </div>
    </div>
  );
}
