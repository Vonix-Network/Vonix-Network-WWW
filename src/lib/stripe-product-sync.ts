import Stripe from 'stripe';
import { db } from '@/db';
import { donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface ProductSyncResult {
  success: boolean;
  rankId: string;
  rankName: string;
  productId: string;
  prices: {
    monthly: string | null;
    quarterly: string | null;
    semiannual: string | null;
    yearly: string | null;
  };
  created: boolean;
  updated: boolean;
  error?: string;
}

interface SyncAllResult {
  success: boolean;
  results: ProductSyncResult[];
  totalRanks: number;
  synced: number;
  created: number;
  updated: number;
  errors: number;
  message: string;
}

/**
 * Syncs Stripe products and prices for a single rank
 * Creates missing products/prices and updates database
 */
export async function syncRankProducts(
  stripe: Stripe,
  rankId: string
): Promise<ProductSyncResult> {
  try {
    // Get rank from database
    const [rank] = await db
      .select()
      .from(donationRanks)
      .where(eq(donationRanks.id, rankId))
      .limit(1);

    if (!rank) {
      return {
        success: false,
        rankId,
        rankName: 'Unknown',
        productId: '',
        prices: { monthly: null, quarterly: null, semiannual: null, yearly: null },
        created: false,
        updated: false,
        error: 'Rank not found in database',
      };
    }

    let productId = rank.stripeProductId;
    let created = false;
    let updated = false;

    // Check if product exists in Stripe
    if (productId && productId.startsWith('prod_')) {
      try {
        const product = await stripe.products.retrieve(productId);
        if (product.active) {
          console.log(`✅ Product exists for ${rank.name}:`, productId);
        } else {
          console.log(`⚠️ Product ${productId} is inactive, will create new one`);
          productId = null;
        }
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          console.log(`⚠️ Product ${productId} not found in Stripe, will create new one`);
          productId = null;
        } else {
          throw error;
        }
      }
    } else {
      productId = null;
    }

    // Create product if missing
    if (!productId) {
      console.log(`📦 Creating Stripe product for ${rank.name}...`);
      const product = await stripe.products.create({
        name: `${rank.name} Rank`,
        description: `${rank.name} donation rank with exclusive perks`,
        metadata: {
          rankId: rank.id,
          rankName: rank.name,
          minAmount: rank.minAmount.toString(),
        },
      });
      productId = product.id;
      created = true;
      console.log(`✅ Product created:`, productId);
    }

    // Calculate prices for each interval
    const monthlyAmount = Math.round(rank.minAmount * 100); // 30 days
    const quarterlyAmount = Math.round(rank.minAmount * 3 * 0.95 * 100); // 90 days (5% discount)
    const semiannualAmount = Math.round(rank.minAmount * 6 * 0.90 * 100); // 180 days (10% discount)
    const yearlyAmount = Math.round(rank.minAmount * 12 * 0.85 * 100); // 365 days (15% discount)

    // Check and create prices
    const prices = {
      monthly: rank.stripePriceMonthly,
      quarterly: rank.stripePriceQuarterly,
      semiannual: rank.stripePriceSemiannual,
      yearly: rank.stripePriceYearly,
    };

    // Validate existing prices and create missing ones
    const priceConfigs = [
      { key: 'monthly' as const, interval: 'month' as const, intervalCount: 1, amount: monthlyAmount, days: 30 },
      { key: 'quarterly' as const, interval: 'month' as const, intervalCount: 3, amount: quarterlyAmount, days: 90 },
      { key: 'semiannual' as const, interval: 'month' as const, intervalCount: 6, amount: semiannualAmount, days: 180 },
      { key: 'yearly' as const, interval: 'year' as const, intervalCount: 1, amount: yearlyAmount, days: 365 },
    ];

    for (const config of priceConfigs) {
      let priceId = prices[config.key];
      let needsCreation = false;

      // Validate existing price
      if (priceId && priceId.startsWith('price_')) {
        try {
          const existingPrice = await stripe.prices.retrieve(priceId);
          if (
            existingPrice.active &&
            existingPrice.product === productId &&
            existingPrice.recurring?.interval === config.interval &&
            existingPrice.recurring?.interval_count === config.intervalCount
          ) {
            console.log(`✅ Valid ${config.key} price exists:`, priceId);
            continue; // Price is valid, skip creation
          } else {
            console.log(`⚠️ ${config.key} price ${priceId} is invalid/inactive, will create new one`);
            needsCreation = true;
          }
        } catch (error: any) {
          if (error.code === 'resource_missing') {
            console.log(`⚠️ ${config.key} price ${priceId} not found, will create new one`);
            needsCreation = true;
          } else {
            throw error;
          }
        }
      } else {
        needsCreation = true;
      }

      // Create price if needed
      if (needsCreation) {
        console.log(`💰 Creating ${config.key} price for ${rank.name} (${config.days} days)...`);
        const newPrice = await stripe.prices.create({
          currency: 'usd',
          unit_amount: config.amount,
          recurring: {
            interval: config.interval,
            interval_count: config.intervalCount,
          },
          product: productId,
          metadata: {
            rankId: rank.id,
            rankName: rank.name,
            days: config.days.toString(),
            interval: config.key,
          },
        });
        prices[config.key] = newPrice.id;
        updated = true;
        console.log(`✅ ${config.key} price created:`, newPrice.id);
      }
    }

    // Update database with product and price IDs
    if (created || updated) {
      await db
        .update(donationRanks)
        .set({
          stripeProductId: productId,
          stripePriceMonthly: prices.monthly,
          stripePriceQuarterly: prices.quarterly,
          stripePriceSemiannual: prices.semiannual,
          stripePriceYearly: prices.yearly,
          updatedAt: new Date(),
        })
        .where(eq(donationRanks.id, rank.id));
      
      console.log(`💾 Database updated for ${rank.name}`);
    }

    return {
      success: true,
      rankId: rank.id,
      rankName: rank.name,
      productId,
      prices,
      created,
      updated,
    };
  } catch (error: any) {
    console.error(`❌ Error syncing products for rank ${rankId}:`, error);
    return {
      success: false,
      rankId,
      rankName: 'Error',
      productId: '',
      prices: { monthly: null, quarterly: null, semiannual: null, yearly: null },
      created: false,
      updated: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Syncs Stripe products and prices for ALL ranks
 * Automatically creates missing products/prices and updates database
 */
export async function syncAllRankProducts(stripeSecretKey?: string): Promise<SyncAllResult> {
  try {
    const secretKey = stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return {
        success: false,
        results: [],
        totalRanks: 0,
        synced: 0,
        created: 0,
        updated: 0,
        errors: 1,
        message: 'Stripe secret key not configured',
      };
    }

    const stripe = new Stripe(secretKey);

    // Get all ranks from database
    const ranks = await db.select().from(donationRanks);

    if (ranks.length === 0) {
      return {
        success: true,
        results: [],
        totalRanks: 0,
        synced: 0,
        created: 0,
        updated: 0,
        errors: 0,
        message: 'No ranks found in database',
      };
    }

    console.log(`\n🔄 Starting Stripe product sync for ${ranks.length} ranks...\n`);

    // Sync each rank
    const results: ProductSyncResult[] = [];
    for (const rank of ranks) {
      console.log(`\n📋 Processing ${rank.name} (${rank.id})...`);
      const result = await syncRankProducts(stripe, rank.id);
      results.push(result);
    }

    // Calculate statistics
    const synced = results.filter(r => r.success).length;
    const created = results.filter(r => r.created).length;
    const updated = results.filter(r => r.updated).length;
    const errors = results.filter(r => !r.success).length;

    const message = errors > 0
      ? `Sync completed with ${errors} error(s). ${synced}/${ranks.length} ranks synced successfully.`
      : `All ${synced} ranks synced successfully! ${created} products created, ${updated} prices updated.`;

    console.log(`\n✅ ${message}\n`);

    return {
      success: errors === 0,
      results,
      totalRanks: ranks.length,
      synced,
      created,
      updated,
      errors,
      message,
    };
  } catch (error: any) {
    console.error('❌ Fatal error during product sync:', error);
    return {
      success: false,
      results: [],
      totalRanks: 0,
      synced: 0,
      created: 0,
      updated: 0,
      errors: 1,
      message: error.message || 'Fatal error during sync',
    };
  }
}

/**
 * Quick check if a rank needs product sync
 */
export function rankNeedsSync(rank: {
  stripeProductId: string | null;
  stripePriceMonthly: string | null;
  stripePriceQuarterly: string | null;
  stripePriceSemiannual: string | null;
  stripePriceYearly: string | null;
}): boolean {
  return (
    !rank.stripeProductId ||
    !rank.stripeProductId.startsWith('prod_') ||
    !rank.stripePriceMonthly?.startsWith('price_') ||
    !rank.stripePriceQuarterly?.startsWith('price_') ||
    !rank.stripePriceSemiannual?.startsWith('price_') ||
    !rank.stripePriceYearly?.startsWith('price_')
  );
}
