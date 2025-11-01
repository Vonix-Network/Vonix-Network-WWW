export const runtime = 'nodejs';
/**
 * Square Status API
 * 
 * Returns whether Square integration is enabled
 */

import { NextResponse } from 'next/server';
import { isSquareEnabled, getSquareConfig } from '@/lib/square/config';

export async function GET() {
  const config = getSquareConfig();
  
  return NextResponse.json({
    enabled: isSquareEnabled(),
    environment: config.enabled ? config.environment : null,
    applicationId: config.enabled ? config.applicationId : null,
    locationId: config.enabled ? config.locationId : null,
  });
}
