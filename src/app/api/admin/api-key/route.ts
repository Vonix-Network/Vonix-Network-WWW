import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate a secure API key
function generateApiKey(): string {
  return randomBytes(32).toString('base64url');
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if registration API key exists in database
    let [apiKeyRecord] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.name, 'registration'))
      .limit(1);

    // If no key exists, generate one
    if (!apiKeyRecord) {
      const newKey = generateApiKey();
      [apiKeyRecord] = await db
        .insert(apiKeys)
        .values({
          name: 'registration',
          key: newKey,
        })
        .returning();
    }

    return NextResponse.json({ 
      apiKey: apiKeyRecord.key,
      createdAt: apiKeyRecord.createdAt,
      updatedAt: apiKeyRecord.updatedAt,
      usage: {
        header: 'X-API-Key',
        endpoints: [
          '/api/registration/generate-code',
          '/api/registration/check-registration', 
          '/api/registration/minecraft-login',
          '/api/registration/minecraft-register'
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Regenerate API key
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const newKey = generateApiKey();
    
    // Check if key exists
    const [existingKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.name, 'registration'))
      .limit(1);

    let apiKeyRecord;
    
    if (existingKey) {
      // Update existing key
      [apiKeyRecord] = await db
        .update(apiKeys)
        .set({
          key: newKey,
          updatedAt: new Date(),
        })
        .where(eq(apiKeys.name, 'registration'))
        .returning();
    } else {
      // Create new key
      [apiKeyRecord] = await db
        .insert(apiKeys)
        .values({
          name: 'registration',
          key: newKey,
        })
        .returning();
    }

    return NextResponse.json({ 
      apiKey: apiKeyRecord.key,
      createdAt: apiKeyRecord.createdAt,
      updatedAt: apiKeyRecord.updatedAt,
      message: 'API key regenerated successfully',
      usage: {
        header: 'X-API-Key',
        endpoints: [
          '/api/registration/generate-code',
          '/api/registration/check-registration', 
          '/api/registration/minecraft-login',
          '/api/registration/minecraft-register'
        ]
      }
    });

  } catch (error) {
    console.error('Error regenerating API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
