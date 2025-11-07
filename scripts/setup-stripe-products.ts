/**
 * Stripe Product Catalog Setup Script
 * 
 * This script creates Stripe products and prices for all donation ranks
 * following Stripe's best practices. Run this ONCE to initialize your
 * product catalog.
 * 
 * Usage: npx tsx scripts/setup-stripe-products.ts
 */

import Stripe from 'stripe';
import { db } from '../src/db';
import { donationRanks } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

interface PriceDiscount {
  monthly: number; // 0 = no discount
  quarterly: number; // e.g., 0.10 = 10% off
  semiannual: number; // e.g., 0.15 = 15% off
  yearly: number; // e.g., 0.20 = 20% off
}

// Recommended discount structure
const PRICE_DISCOUNTS: PriceDiscount = {
  monthly: 0, // Full price
  quarterly: 0.05, // 5% off (3 months commitment)
  semiannual: 0.10, // 10% off (6 months commitment)
  yearly: 0.15, // 15% off (1 year commitment)
};

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe Product Catalog...\n');

  try {
    // Fetch all ranks from database
    const ranks = await db.select().from(donationRanks);

    if (ranks.length === 0) {
      console.error('❌ No ranks found in database. Please create ranks first.');
      process.exit(1);
    }

    console.log(`Found ${ranks.length} ranks to process\n`);

    for (const rank of ranks) {
      console.log(`\n📦 Processing rank: ${rank.name} (${rank.id})`);
      console.log(`   Base price: $${rank.minAmount}/month`);

      // Skip if already has Stripe product
      if (rank.stripeProductId) {
        console.log(`   ⚠️  Already has Stripe product (${rank.stripeProductId})`);
        console.log(`   Skipping... (delete stripeProductId from DB to recreate)`);
        continue;
      }

      // Create Stripe Product
      console.log(`   Creating Stripe product...`);
      const product = await stripe.products.create({
        name: `${rank.name} Rank`,
        description: rank.subtitle || `${rank.name} donation rank for Vonix Network`,
        metadata: {
          rankId: rank.id,
          rankName: rank.name,
          color: rank.color,
          duration: rank.duration.toString(),
        },
        // Optional: Add image if you have rank badges
        // images: ['https://yoursite.com/badges/${rank.id}.png'],
      });

      console.log(`   ✅ Product created: ${product.id}`);

      // Create prices for different intervals
      const prices: Record<string, string> = {};

      // Monthly Price (30 days)
      console.log(`   Creating monthly price...`);
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: Math.round(rank.minAmount * 100),
        recurring: { interval: 'month' },
        metadata: {
          interval: 'monthly',
          days: '30',
          rankId: rank.id,
        },
      });
      prices.monthly = monthlyPrice.id;
      console.log(`   ✅ Monthly: ${monthlyPrice.id} - $${rank.minAmount}/month`);

      // Quarterly Price (90 days) - with discount
      const quarterlyAmount = rank.minAmount * 3 * (1 - PRICE_DISCOUNTS.quarterly);
      console.log(`   Creating quarterly price (${PRICE_DISCOUNTS.quarterly * 100}% off)...`);
      const quarterlyPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: Math.round(quarterlyAmount * 100),
        recurring: { interval: 'month', interval_count: 3 },
        metadata: {
          interval: 'quarterly',
          days: '90',
          rankId: rank.id,
          discountPercent: (PRICE_DISCOUNTS.quarterly * 100).toString(),
        },
      });
      prices.quarterly = quarterlyPrice.id;
      console.log(`   ✅ Quarterly: ${quarterlyPrice.id} - $${quarterlyAmount.toFixed(2)}/3 months`);

      // Semiannual Price (180 days) - with discount
      const semiannualAmount = rank.minAmount * 6 * (1 - PRICE_DISCOUNTS.semiannual);
      console.log(`   Creating semiannual price (${PRICE_DISCOUNTS.semiannual * 100}% off)...`);
      const semiannualPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: Math.round(semiannualAmount * 100),
        recurring: { interval: 'month', interval_count: 6 },
        metadata: {
          interval: 'semiannual',
          days: '180',
          rankId: rank.id,
          discountPercent: (PRICE_DISCOUNTS.semiannual * 100).toString(),
        },
      });
      prices.semiannual = semiannualPrice.id;
      console.log(`   ✅ Semiannual: ${semiannualPrice.id} - $${semiannualAmount.toFixed(2)}/6 months`);

      // Yearly Price (365 days) - with discount
      const yearlyAmount = rank.minAmount * 12 * (1 - PRICE_DISCOUNTS.yearly);
      console.log(`   Creating yearly price (${PRICE_DISCOUNTS.yearly * 100}% off)...`);
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: Math.round(yearlyAmount * 100),
        recurring: { interval: 'year' },
        metadata: {
          interval: 'yearly',
          days: '365',
          rankId: rank.id,
          discountPercent: (PRICE_DISCOUNTS.yearly * 100).toString(),
        },
      });
      prices.yearly = yearlyPrice.id;
      console.log(`   ✅ Yearly: ${yearlyPrice.id} - $${yearlyAmount.toFixed(2)}/year`);

      // Update database with Stripe IDs
      console.log(`   Updating database with Stripe IDs...`);
      await db
        .update(donationRanks)
        .set({
          stripeProductId: product.id,
          stripePriceMonthly: prices.monthly,
          stripePriceQuarterly: prices.quarterly,
          stripePriceSemiannual: prices.semiannual,
          stripePriceYearly: prices.yearly,
        })
        .where(eq(donationRanks.id, rank.id));

      console.log(`   ✅ Database updated for ${rank.name}`);
      console.log(`\n   ✨ ${rank.name} setup complete!`);
    }

    console.log('\n\n🎉 All done! Stripe Product Catalog is ready!');
    console.log('\n📊 Summary:');
    console.log(`   Products created: ${ranks.length}`);
    console.log(`   Prices created: ${ranks.length * 4} (4 per rank)`);
    console.log('\n🔗 View in Stripe Dashboard:');
    console.log(`   https://dashboard.stripe.com/products`);
    console.log('\n💡 Next steps:');
    console.log(`   1. Run database migration: npm run db:push`);
    console.log(`   2. Verify products in Stripe Dashboard`);
    console.log(`   3. Update checkout code to use price IDs`);

  } catch (error: any) {
    console.error('\n❌ Error setting up Stripe products:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
setupStripeProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
