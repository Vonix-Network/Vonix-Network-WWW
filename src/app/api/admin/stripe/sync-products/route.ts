import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { syncAllRankProducts } from '@/lib/stripe-product-sync';

/**
 * POST /api/admin/stripe/sync-products
 * Admin endpoint to sync Stripe products and prices for all donation ranks
 * Creates missing products/prices and updates database automatically
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Require admin authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    console.log(`🔐 Admin ${session.user.username} (${session.user.id}) initiated Stripe product sync`);

    // Run sync
    const result = await syncAllRankProducts();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      stats: {
        totalRanks: result.totalRanks,
        synced: result.synced,
        created: result.created,
        updated: result.updated,
        errors: result.errors,
      },
      results: result.results.map(r => ({
        rankId: r.rankId,
        rankName: r.rankName,
        success: r.success,
        productId: r.productId,
        created: r.created,
        updated: r.updated,
        error: r.error,
        prices: r.prices,
      })),
    });
  } catch (error: any) {
    console.error('Error in sync-products API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to sync products',
        message: 'An unexpected error occurred during product sync',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/stripe/sync-products
 * Check which ranks need syncing (without making changes)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { db } = await import('@/db');
    const { donationRanks } = await import('@/db/schema');
    const { rankNeedsSync } = await import('@/lib/stripe-product-sync');

    const ranks = await db.select().from(donationRanks);

    const status = ranks.map(rank => ({
      id: rank.id,
      name: rank.name,
      needsSync: rankNeedsSync(rank),
      hasProduct: !!rank.stripeProductId && rank.stripeProductId.startsWith('prod_'),
      prices: {
        monthly: !!rank.stripePriceMonthly && rank.stripePriceMonthly.startsWith('price_'),
        quarterly: !!rank.stripePriceQuarterly && rank.stripePriceQuarterly.startsWith('price_'),
        semiannual: !!rank.stripePriceSemiannual && rank.stripePriceSemiannual.startsWith('price_'),
        yearly: !!rank.stripePriceYearly && rank.stripePriceYearly.startsWith('price_'),
      },
    }));

    const needsSync = status.filter(s => s.needsSync).length;

    return NextResponse.json({
      totalRanks: ranks.length,
      needsSync,
      allConfigured: needsSync === 0,
      ranks: status,
    });
  } catch (error: any) {
    console.error('Error checking sync status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check sync status' },
      { status: 500 }
    );
  }
}
