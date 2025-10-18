import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { privateMessages } from '@/db/schema';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, content } = body;

    if (!recipientId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (content.trim().length === 0 || content.length > 1000) {
      return NextResponse.json({ error: 'Message must be 1-1000 characters' }, { status: 400 });
    }

    const senderId = parseInt(session.user.id);
    const recipientIdNum = parseInt(recipientId);

    if (senderId === recipientIdNum) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
    }

    const [message] = await db
      .insert(privateMessages)
      .values({
        senderId,
        recipientId: recipientIdNum,
        content: content.trim(),
        read: false,
      })
      .returning();

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
