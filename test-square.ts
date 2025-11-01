#!/usr/bin/env tsx

import { getSquareConfig, isSquareEnabled } from './src/lib/square/config';
import { getSquareClient } from './src/lib/square/client';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Square Configuration Test');
console.log('==========================\n');

const config = getSquareConfig();
console.log('Environment Variables:');
console.log(`- SQUARE_INTEGRATION_ENABLED: ${process.env.SQUARE_INTEGRATION_ENABLED}`);
console.log(`- SQUARE_ACCESS_TOKEN: ${process.env.SQUARE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`- SQUARE_LOCATION_ID: ${process.env.SQUARE_LOCATION_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`- SQUARE_APPLICATION_ID: ${process.env.SQUARE_APPLICATION_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`- SQUARE_ENVIRONMENT: ${process.env.SQUARE_ENVIRONMENT || 'sandbox (default)'}\n`);

console.log('Configuration Object:');
console.log(`- enabled: ${config.enabled}`);
console.log(`- environment: ${config.environment}`);
console.log(`- accessToken: ${config.accessToken ? '✅ Present' : '❌ Missing'}`);
console.log(`- locationId: ${config.locationId ? '✅ Present' : '❌ Missing'}`);
console.log(`- applicationId: ${config.applicationId ? '✅ Present' : '❌ Missing'}\n`);

console.log('Square Status:');
console.log(`- isSquareEnabled(): ${isSquareEnabled()}\n`);

if (isSquareEnabled()) {
  console.log('Testing Square Client Initialization...');
  try {
    const client = await getSquareClient();
    if (client) {
      console.log('✅ Square client initialized successfully');
      console.log('✅ Square setup appears to be working');
    } else {
      console.log('❌ Square client failed to initialize');
    }
  } catch (error) {
    console.error('❌ Error testing Square client:', error);
  }
} else {
  console.log('❌ Square is disabled - check environment variables');
}

console.log('\n==========================');
console.log('If you see "Square client initialized successfully" above,');
console.log('then the backend SDK is working. The 400 error might be');
console.log('due to invalid credentials, location ID, or payment parameters.');
console.log('Check the server logs for detailed Square API error messages.');
