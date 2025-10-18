import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/settings/discord
 * Get Discord settings
 */
export async function GET() {
  try {
    await requireAdmin();

    const settings = await db.select().from(siteSettings).where(eq(siteSettings.key, 'discord_settings'));
    
    const defaultSettings = {
      inviteUrl: 'https://discord.gg/C7xmVgQnK5',
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
    console.error('Error getting Discord settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/discord
 * Update Discord settings
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { inviteUrl } = body;

    // Validate Discord invite URL
    if (inviteUrl && !inviteUrl.startsWith('https://discord.gg/')) {
      return NextResponse.json(
        { error: 'Invalid Discord invite URL. Must start with https://discord.gg/' },
        { status: 400 }
      );
    }

    const settings = {
      inviteUrl: inviteUrl || 'https://discord.gg/C7xmVgQnK5',
    };

    // Check if settings exist
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, 'discord_settings'));

    if (existing.length > 0) {
      // Update existing
      await db
        .update(siteSettings)
        .set({
          value: JSON.stringify(settings),
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.key, 'discord_settings'));
    } else {
      // Insert new
      await db.insert(siteSettings).values({
        key: 'discord_settings',
        value: JSON.stringify(settings),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Discord settings updated successfully',
      settings,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating Discord settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
