import { NextRequest, NextResponse } from 'next/server';
import { warmDatabaseConnections } from '@/lib/connection-warmup';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Warm up database connections on cold start
export async function GET() {
  try {
    await warmDatabaseConnections();
    return NextResponse.json({ success: true, message: 'Database connections warmed up' });
  } catch (error) {
    console.error('Failed to warm up connections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to warm up connections' },
      { status: 500 }
    );
  }
}
