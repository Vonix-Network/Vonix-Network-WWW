import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { servers } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const serverList = await db
      .select()
      .from(servers)
      .orderBy(servers.orderIndex, desc(servers.createdAt));

    return NextResponse.json({ servers: serverList });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching servers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      name,
      description,
      ipAddress,
      port,
      version,
      modpackName,
      bluemapUrl,
      curseforgeUrl,
      orderIndex,
    } = body;

    if (!name || !ipAddress) {
      return NextResponse.json(
        { error: 'Name and IP address are required' },
        { status: 400 }
      );
    }

    const [newServer] = await db
      .insert(servers)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        ipAddress: ipAddress.trim(),
        port: port || 25565,
        modpackName: modpackName?.trim() || null,
        bluemapUrl: bluemapUrl?.trim() || null,
        curseforgeUrl: curseforgeUrl?.trim() || null,
        orderIndex: orderIndex || 0,
        // Don't set status, version, playersMax, or playersOnline
        // These will be fetched live from mcstatus.io
      })
      .returning();

    return NextResponse.json({ server: newServer }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error creating server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
