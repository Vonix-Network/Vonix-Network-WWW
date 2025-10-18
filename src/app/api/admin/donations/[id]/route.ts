import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { donations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * PATCH /api/admin/donations/[id]
 * Update donation visibility or details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const donationId = parseInt(params.id);
    if (isNaN(donationId)) {
      return NextResponse.json({ error: 'Invalid donation ID' }, { status: 400 });
    }

    const body = await request.json();
    const { displayed, message, amount } = body;

    const updates: any = {};
    if (displayed !== undefined) updates.displayed = displayed;
    if (message !== undefined) updates.message = message;
    if (amount !== undefined) updates.amount = amount;

    await db
      .update(donations)
      .set(updates)
      .where(eq(donations.id, donationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating donation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/donations/[id]
 * Delete a donation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const donationId = parseInt(params.id);
    if (isNaN(donationId)) {
      return NextResponse.json({ error: 'Invalid donation ID' }, { status: 400 });
    }

    await db.delete(donations).where(eq(donations.id, donationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting donation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
