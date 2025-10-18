import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { servers } from '@/db/schema';

export async function POST() {
  try {
    await requireAdmin();

    // Reset all live-fetched fields to null/0
    // These should only be populated by live fetches from mcstatus.io
    await db
      .update(servers)
      .set({
        status: 'offline',
        playersOnline: 0,
        playersMax: 0,
        version: null,
      });

    return NextResponse.json({ 
      success: true,
      message: 'All server defaults cleaned. Live data will be fetched from mcstatus.io on next page load.'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error cleaning server defaults:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
