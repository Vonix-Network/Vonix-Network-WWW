import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all settings
    const allSettings = await db.select().from(settings);
    
    // Convert to object
    const settingsObj: Record<string, string> = {};
    allSettings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, data } = body;

    // Save settings based on category
    for (const [key, value] of Object.entries(data)) {
      const settingKey = `${category}.${key}`;
      
      // Check if setting exists
      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, settingKey))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(settings)
          .set({ 
            value: String(value), 
            updatedAt: new Date() 
          })
          .where(eq(settings.key, settingKey));
      } else {
        // Insert new
        await db.insert(settings).values({
          key: settingKey,
          value: String(value),
          updatedAt: new Date(),
        });
      }
    }

    console.log(`✅ Settings saved: ${category}`);
    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
