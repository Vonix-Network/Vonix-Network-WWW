import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { fetchServerStatus, fetchMultipleServerStatuses, type ServerStatus } from '@/lib/server-status';

// Force dynamic rendering - NO CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const server = searchParams.get('server');
    
    if (!server) {
      return NextResponse.json(
        { error: 'Server parameter is required' },
        { status: 400 }
      );
    }

    // Check server status with no caching
    const status = await fetchServerStatus(server);
    
    // Return with headers to prevent any caching
    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Server status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check server status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { servers } = body;
    
    if (!servers || !Array.isArray(servers)) {
      return NextResponse.json(
        { error: 'Servers array is required' },
        { status: 400 }
      );
    }

    // Check multiple servers concurrently
    const results = await fetchMultipleServerStatuses(servers);

    // Return with headers to prevent any caching
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Bulk server status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check server statuses' },
      { status: 500 }
    );
  }
}

