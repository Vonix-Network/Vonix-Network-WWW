import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { donationRanks, users } from '@/db/schema';
import { DonorRanksClient } from '@/components/admin/donor-ranks-client';
import { Award } from 'lucide-react';
import { sql } from 'drizzle-orm';

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

  return (
    <div className="max-w-7xl mx-auto fade-in-up">
      {/* Header */}
      <div className="glass border border-green-500/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <Award className="h-8 w-8 text-yellow-400" />
          <div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Donor Ranks</span>
            </h1>
            <p className="text-gray-400">Manage donation ranks and user assignments</p>
          </div>
        </div>
      </div>

      <DonorRanksClient initialRanks={ranksWithCounts} />
    </div>
  );
}
