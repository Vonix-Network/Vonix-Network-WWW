import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

// WebSocket broadcast function (we'll implement this properly)
async function broadcastToWebSocketClients(type: string, data: any) {
  try {
    await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ws`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });
  } catch (error) {
    console.error('Failed to broadcast WebSocket message:', error);
  }
}

export async function GET() {
  try {
    await requireAdmin();

    const ranks = await db.select().from(donationRanks);
    return NextResponse.json(ranks, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching donor ranks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donor ranks' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { id, name, minAmount, color, textColor, icon, badge, glow, duration, subtitle } = body;

    if (!id || !name || minAmount === undefined || !color || !textColor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [rank] = await db
      .insert(donationRanks)
      .values({
        id,
        name,
        minAmount,
        color,
        textColor,
        icon: icon || null,
        badge: badge || null,
        glow: glow || false,
        duration: duration || 30,
        subtitle: subtitle || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Broadcast the new rank to all connected clients
    await broadcastToWebSocketClients('RANK_CREATED', { rank });

    return NextResponse.json({ success: true, rank });
  } catch (error) {
    console.error('Error creating donor rank:', error);
    return NextResponse.json(
      { error: 'Failed to create donor rank' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { id, name, minAmount, color, textColor, icon, badge, glow, duration, subtitle } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Rank ID is required' },
        { status: 400 }
      );
    }

    const [rank] = await db
      .update(donationRanks)
      .set({
        name,
        minAmount,
        color,
        textColor,
        icon,
        badge,
        glow,
        duration,
        subtitle,
        updatedAt: new Date(),
      })
      .where(eq(donationRanks.id, id))
      .returning();

    // Broadcast the updated rank to all connected clients
    await broadcastToWebSocketClients('RANK_UPDATED', { rank });

    return NextResponse.json({ success: true, rank });
  } catch (error) {
    console.error('Error updating donor rank:', error);
    return NextResponse.json(
      { error: 'Failed to update donor rank' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Rank ID is required' },
        { status: 400 }
      );
    }

    // Get the rank before deleting for broadcast
    const [rank] = await db.select().from(donationRanks).where(eq(donationRanks.id, id));

    await db.delete(donationRanks).where(eq(donationRanks.id, id));

    // Broadcast the deleted rank to all connected clients
    await broadcastToWebSocketClients('RANK_DELETED', { rankId: id, rank });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting donor rank:', error);
    return NextResponse.json(
      { error: 'Failed to delete donor rank' },
      { status: 500 }
    );
  }
}
