import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { desc, inArray } from 'drizzle-orm';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/chat/messages
 * Get recent chat messages
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Enforce history cap of 100 messages (keep newest 100)
    const newest = await db
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .orderBy(desc(chatMessages.timestamp))
      .limit(100);

    const keepIds = new Set(newest.map((r) => r.id));
    const all = await db.select({ id: chatMessages.id }).from(chatMessages);
    const deleteIds = all.map((r) => r.id).filter((id) => !keepIds.has(id));
    if (deleteIds.length > 0) {
      await db.delete(chatMessages).where(inArray(chatMessages.id, deleteIds));
    }

    // Fetch messages from database (newest first)
    const messages = await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);

    // Reverse to get chronological order
    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}