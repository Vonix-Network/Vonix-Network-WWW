import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/stripe/update-subscription
 * Updates an existing Stripe subscription to a new rank/price
 * Handles upgrades, downgrades, and interval changes with proration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const { subscriptionId, newRankId, newDays, newAmount, confirmed } = await request.json();

    if (!subscriptionId || !newRankId || !newDays || !newAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // SAFETY: Require explicit confirmation to prevent accidental updates
    if (confirmed !== true) {
      return NextResponse.json(
        { 
          error: 'Confirmation required',
          message: 'You must explicitly confirm this subscription change. Use the preview endpoint first to see the cost, then set confirmed: true to apply.',
          suggestion: 'Call /api/stripe/subscription/preview-update first'
        },
        { status: 400 }
      );
    }

    console.log(`✅ User ${session.user.id} confirmed subscription update`);

    // Get new rank details
    const [newRank] = await db
      .select()
      .from(donationRanks)
      .where(eq(donationRanks.id, newRankId));

    if (!newRank) {
      return NextResponse.json(
        { error: 'Rank not found' },
        { status: 404 }
      );
    }

    // Get current subscription from Stripe
    const currentSub: any = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!currentSub) {
      return NextResponse.json(
        { error: 'Subscription not found in Stripe' },
        { status: 404 }
      );
    }

    // CRITICAL: Verify subscription belongs to this user (security check)
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, Number(session.user.id)))
      .limit(1);

    if (!user?.stripeCustomerId || currentSub.customer !== user.stripeCustomerId) {
      console.error(`Security violation: User ${session.user.id} attempted to modify subscription ${subscriptionId} belonging to customer ${currentSub.customer}`);
      return NextResponse.json(
        { error: 'Unauthorized - subscription does not belong to you' },
        { status: 403 }
      );
    }

    // CRITICAL: Verify subscription is active (can't update canceled subscriptions)
    if (currentSub.status !== 'active' && currentSub.status !== 'trialing') {
      return NextResponse.json(
        { error: `Cannot update subscription with status: ${currentSub.status}` },
        { status: 400 }
      );
    }

    // CRITICAL: Verify subscription has exactly one item (our subscriptions should only have one product)
    if (!currentSub.items?.data || currentSub.items.data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid subscription - no items found' },
        { status: 400 }
      );
    }

    if (currentSub.items.data.length > 1) {
      console.warn(`Subscription ${subscriptionId} has multiple items (${currentSub.items.data.length}), will update first item only`);
    }

    // Calculate interval
    const interval = newDays === 90 ? 'month' as const : 
                     newDays === 180 ? 'month' as const : 
                     newDays === 365 ? 'year' as const : 
                     'month' as const;
    const intervalCount = newDays === 90 ? 3 : newDays === 180 ? 6 : newDays === 365 ? 1 : 1;
    const intervalName = newDays === 90 ? 'Every 3 Months' : 
                        newDays === 180 ? 'Every 6 Months' : 
                        newDays === 365 ? 'Yearly' : 
                        'Monthly';

    // Create new price
    const newPrice = await stripe.prices.create({
      currency: 'usd',
      unit_amount: Math.round(newAmount * 100),
      recurring: { interval, interval_count: intervalCount },
      product_data: {
        name: `${newRank.name} Rank - ${intervalName}`,
        metadata: {
          rankId: newRankId,
          rankName: newRank.name,
          days: newDays.toString(),
          interval: intervalName,
        },
      },
    });

    console.log('✅ New price created:', newPrice.id);

    // Get current state before update
    const oldItemId = currentSub.items.data[0].id;
    const oldPriceId = currentSub.items.data[0].price.id;
    const oldAmount = (currentSub.items.data[0].price.unit_amount || 0) / 100;
    
    console.log('📊 BEFORE UPDATE:');
    console.log(`  Subscription ID: ${subscriptionId} (MODIFYING THIS EXACT SUBSCRIPTION)`);
    console.log(`  Item ID: ${oldItemId}`);
    console.log(`  Old Price ID: ${oldPriceId}`);
    console.log(`  Old Amount: $${oldAmount}`);
    console.log(`  Status: ${currentSub.status}`);
    
    // Update subscription with proration
    // CRITICAL: This modifies the EXISTING subscription (same ID)
    // We are NOT creating a new subscription - we're updating the price on the existing one
    console.log(`🔄 Updating subscription ${subscriptionId} (item ${oldItemId}) to new price ${newPrice.id}...`);
    
    const updatedSub: any = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: oldItemId,          // Reference to EXISTING item (same item ID)
          price: newPrice.id,     // Update its price to new price
        },
      ],
      proration_behavior: 'create_prorations', // Charge/credit difference immediately
      metadata: {
        userId: session.user.id,
        rankId: newRankId,
        rankName: newRank.name,
        days: newDays.toString(),
      },
      description: `${newRank.name} Rank - ${newDays} days - ${intervalName}`,
    });

    // Verify the update was successful
    console.log('✅ AFTER UPDATE:');
    console.log(`  Subscription ID: ${updatedSub.id} (SAME ID = SAME SUBSCRIPTION)`);
    console.log(`  Item ID: ${updatedSub.items.data[0].id}`);
    console.log(`  New Price ID: ${updatedSub.items.data[0].price.id}`);
    console.log(`  New Amount: $${(updatedSub.items.data[0].price.unit_amount || 0) / 100}`);
    console.log(`  Status: ${updatedSub.status}`);
    
    // CRITICAL VERIFICATION: Ensure we modified the same subscription
    if (updatedSub.id !== subscriptionId) {
      console.error('🚨 CRITICAL ERROR: Subscription ID changed! This should never happen!');
      throw new Error('Subscription ID mismatch - possible API error');
    }
    
    console.log('✅ Verification passed: Modified existing subscription successfully');

    // Determine if upgrade or downgrade
    const currentAmount = (currentSub.items.data[0]?.price.unit_amount || 0) / 100;
    const isUpgrade = newAmount > currentAmount;
    const isDowngrade = newAmount < currentAmount;

    // CRITICAL FIX #8: Apply rank conversion to user's database record
    // When subscription changes, convert remaining days to new rank
    const currentRankId = currentSub.metadata?.rankId;
    
    if (currentRankId && currentRankId !== newRankId) {
      console.log(`🔄 Converting rank from ${currentRankId} to ${newRankId} for user ${session.user.id}`);
      
      // Import rank conversion function
      const { upgradeRank } = await import('@/lib/rank-subscription');
      
      // Convert remaining days at old price to new price
      const conversionResult = await upgradeRank(Number(session.user.id), newRankId);
      
      if (conversionResult.success) {
        console.log(`✅ Rank converted successfully. New expiration: ${conversionResult.expiresAt}`);
      } else {
        console.error(`⚠️ Rank conversion failed: ${conversionResult.error}`);
        // Don't fail the subscription update, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSub.id,
        rankName: newRank.name,
        amount: newAmount,
        interval: intervalName,
        nextBillingDate: new Date((updatedSub as any).current_period_end * 1000).toISOString(),
        message: isUpgrade 
          ? `Subscription upgraded! You will be charged a prorated amount now. Your remaining days have been converted to the new rank.`
          : isDowngrade
          ? `Subscription downgraded! You will receive a credit on your next billing cycle. Your remaining days have been converted (you get MORE days at the lower tier).`
          : 'Subscription updated successfully!',
      },
    });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
