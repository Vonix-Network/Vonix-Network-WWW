import { NextRequest, NextResponse } from 'next/server';
import { getXPLeaderboard, getUserRank, getTitleForLevel, getColorForLevel } from '@/lib/xp-system';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/xp/leaderboard - Get XP leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50')));
    
    // Get leaderboard
    const leaderboard = await getXPLeaderboard(limit);
    
    // Enhance with additional data
    const enhancedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
      title: user.title || getTitleForLevel(user.level),
      levelColor: getColorForLevel(user.level),
    }));

    // Get current user's rank if logged in
    const session = await getServerSession(authOptions);
    let userRank = null;
    
    if (session?.user?.id) {
      const userId = parseInt(session.user.id);
      const rank = await getUserRank(userId);
      const userEntry = leaderboard.find(u => u.id === userId);
      
      if (userEntry) {
        userRank = {
          ...userEntry,
          rank,
          title: userEntry.title || getTitleForLevel(userEntry.level),
          levelColor: getColorForLevel(userEntry.level),
        };
      }
    }

    return NextResponse.json({
      leaderboard: enhancedLeaderboard,
      userRank,
      total: leaderboard.length,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
