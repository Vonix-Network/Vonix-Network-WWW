import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/stripe/subscription/preview-update
 * Previews the cost of updating a subscription without actually applying it
 * Shows user exactly what they'll be charged before committing
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

    const { subscriptionId, newRankId, newDays, newAmount } = await request.json();

    if (!subscriptionId || !newRankId || !newDays || !newAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

    // Get current subscription
    const currentSub: any = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!currentSub) {
      return NextResponse.json(
        { error: 'Subscription not found in Stripe' },
        { status: 404 }
      );
    }

    // Verify subscription belongs to this user
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, Number(session.user.id)))
      .limit(1);

    if (!user?.stripeCustomerId || currentSub.customer !== user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Unauthorized - subscription does not belong to you' },
        { status: 403 }
      );
    }

    // Verify subscription is active
    if (currentSub.status !== 'active' && currentSub.status !== 'trialing') {
      return NextResponse.json(
        { error: `Cannot update subscription with status: ${currentSub.status}` },
        { status: 400 }
      );
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

    // Create temporary price for preview (Stripe requires this)
    const tempPrice = await stripe.prices.create({
      currency: 'usd',
      unit_amount: Math.round(newAmount * 100),
      recurring: { interval, interval_count: intervalCount },
      product_data: {
        name: `${newRank.name} Rank - ${intervalName}`,
      },
    });

    console.log('Temporary price created for preview:', tempPrice.id);

    // Get upcoming invoice to preview proration
    const itemId = currentSub.items.data[0].id;
    
    try {
      const upcomingInvoice: any = await (stripe.invoices as any).retrieveUpcoming({
        customer: user.stripeCustomerId,
        subscription: subscriptionId,
        subscription_items: [
          {
            id: itemId,
            price: tempPrice.id,
          },
        ],
        subscription_proration_behavior: 'create_prorations',
      });

      // Calculate current and new amounts
      const currentAmount = (currentSub.items.data[0].price.unit_amount || 0) / 100;
      const currentRankName = currentSub.metadata?.rankName || 'Current Rank';
      
      // Calculate proration
      const prorationAmount = (upcomingInvoice.total || 0) / 100;
      const isUpgrade = newAmount > currentAmount;
      const isDowngrade = newAmount < currentAmount;

      // Clean up temporary price (we don't need it after preview)
      // Note: In production, you might want to cache these or use product catalog
      await stripe.prices.update(tempPrice.id, { active: false });
      console.log('Temporary price deactivated');

      // Build user-friendly message
      let message: string;
      let recommendedAction: 'immediate' | 'scheduled';

      if (isUpgrade) {
        message = prorationAmount > 0
          ? `Upgrade to ${newRank.name} now for $${prorationAmount.toFixed(2)}`
          : `Upgrade to ${newRank.name} (no charge - already paid ahead)`;
        recommendedAction = 'immediate';
      } else if (isDowngrade) {
        message = prorationAmount < 0
          ? `Downgrade to ${newRank.name} and receive $${Math.abs(prorationAmount).toFixed(2)} credit`
          : `Downgrade to ${newRank.name} at next renewal`;
        recommendedAction = 'scheduled'; // Recommend scheduled for downgrades
      } else {
        message = `Change to ${newRank.name} - ${intervalName}`;
        recommendedAction = 'immediate';
      }

      return NextResponse.json({
        preview: true,
        current: {
          rankName: currentRankName,
          amount: currentAmount,
          interval: currentSub.items.data[0].price.recurring?.interval || 'month',
        },
        new: {
          rankName: newRank.name,
          amount: newAmount,
          interval: intervalName,
        },
        proration: {
          amount: prorationAmount,
          isUpgrade,
          isDowngrade,
          willCharge: prorationAmount > 0,
          willCredit: prorationAmount < 0,
        },
        message,
        recommendedAction,
        nextBillingDate: new Date(currentSub.current_period_end * 1000).toISOString(),
        effectiveDate: 'immediate', // Change happens immediately
      });
    } catch (error: any) {
      console.error('Error retrieving upcoming invoice:', error);
      
      // Fallback: Return estimated proration without exact calculation
      const currentAmount = (currentSub.items.data[0].price.unit_amount || 0) / 100;
      const estimatedProration = newAmount - currentAmount;
      
      return NextResponse.json({
        preview: true,
        estimated: true, // Flag that this is an estimate
        current: {
          rankName: currentSub.metadata?.rankName || 'Current Rank',
          amount: currentAmount,
        },
        new: {
          rankName: newRank.name,
          amount: newAmount,
          interval: intervalName,
        },
        proration: {
          amount: estimatedProration,
          isUpgrade: newAmount > currentAmount,
          isDowngrade: newAmount < currentAmount,
        },
        message: `Estimated change: ${estimatedProration > 0 ? 'charge' : 'credit'} of $${Math.abs(estimatedProration).toFixed(2)}`,
        note: 'This is an estimate. Actual amount may vary based on usage.',
      });
    }
  } catch (error: any) {
    console.error('Error previewing subscription update:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to preview subscription update' },
      { status: 500 }
    );
  }
}
