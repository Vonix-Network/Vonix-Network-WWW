import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/settings/donations
 * Get donation payment settings
 */
export async function GET() {
  try {
    await requireAdmin();

    // Get settings from database
    const settings = await db.select().from(siteSettings).where(eq(siteSettings.key, 'donation_settings'));
    
    const defaultSettings = {
      paypalEmail: '',
      paypalMeUrl: '',
      solanaAddress: 'CUH7SK5eK9LXJuwU1Y5uYSFV1ivPJ5yE8VTNXPHemxLr',
      bitcoinAddress: '',
      ethereumAddress: '',
      litecoinAddress: '',
    };

    if (settings.length > 0 && settings[0].value) {
      try {
        const parsed = JSON.parse(settings[0].value as string);
        return NextResponse.json({ ...defaultSettings, ...parsed });
      } catch {
        return NextResponse.json(defaultSettings);
      }
    }

    return NextResponse.json(defaultSettings);
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error getting donation settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/donations
 * Update donation payment settings
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { paypalEmail, paypalMeUrl, solanaAddress, bitcoinAddress, ethereumAddress, litecoinAddress } = body;

    // Validate PayPal email
    if (paypalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
      return NextResponse.json(
        { error: 'Invalid PayPal email format' },
        { status: 400 }
      );
    }

    // Validate PayPal.me URL
    if (paypalMeUrl && !paypalMeUrl.startsWith('https://paypal.me/')) {
      return NextResponse.json(
        { error: 'Invalid PayPal.me URL format. Must start with https://paypal.me/' },
        { status: 400 }
      );
    }

    const settings = {
      paypalEmail: paypalEmail || '',
      paypalMeUrl: paypalMeUrl || '',
      solanaAddress: solanaAddress || 'CUH7SK5eK9LXJuwU1Y5uYSFV1ivPJ5yE8VTNXPHemxLr',
      bitcoinAddress: bitcoinAddress || '',
      ethereumAddress: ethereumAddress || '',
      litecoinAddress: litecoinAddress || '',
    };

    // Check if settings exist
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, 'donation_settings'));

    if (existing.length > 0) {
      // Update existing
      await db
        .update(siteSettings)
        .set({
          value: JSON.stringify(settings),
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.key, 'donation_settings'));
    } else {
      // Insert new
      await db.insert(siteSettings).values({
        key: 'donation_settings',
        value: JSON.stringify(settings),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Donation settings updated successfully',
      settings,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating donation settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
