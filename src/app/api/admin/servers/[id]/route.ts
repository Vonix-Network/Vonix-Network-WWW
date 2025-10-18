import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { servers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const serverId = parseInt(params.id);
    if (isNaN(serverId)) {
      return NextResponse.json({ error: 'Invalid server ID' }, { status: 400 });
    }

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
      status,
      playersOnline,
      playersMax,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (ipAddress !== undefined) updateData.ipAddress = ipAddress.trim();
    if (port !== undefined) updateData.port = port;
    if (version !== undefined) updateData.version = version?.trim() || null;
    if (modpackName !== undefined) updateData.modpackName = modpackName?.trim() || null;
    if (bluemapUrl !== undefined) updateData.bluemapUrl = bluemapUrl?.trim() || null;
    if (curseforgeUrl !== undefined) updateData.curseforgeUrl = curseforgeUrl?.trim() || null;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;
    if (status !== undefined) updateData.status = status;
    if (playersOnline !== undefined) updateData.playersOnline = playersOnline;
    if (playersMax !== undefined) updateData.playersMax = playersMax;

    const [updatedServer] = await db
      .update(servers)
      .set(updateData)
      .where(eq(servers.id, serverId))
      .returning();

    if (!updatedServer) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    return NextResponse.json({ server: updatedServer });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const serverId = parseInt(params.id);
    if (isNaN(serverId)) {
      return NextResponse.json({ error: 'Invalid server ID' }, { status: 400 });
    }

    await db.delete(servers).where(eq(servers.id, serverId));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
