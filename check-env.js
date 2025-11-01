#!/usr/bin/env tsx

console.log('🔍 Square Environment Check');
console.log('==========================\n');

// Check each environment variable
const vars = [
  'SQUARE_INTEGRATION_ENABLED',
  'SQUARE_ACCESS_TOKEN',
  'SQUARE_LOCATION_ID',
  'SQUARE_APPLICATION_ID',
  'SQUARE_ENVIRONMENT'
];

let allSet = true;

vars.forEach(varName => {
  const value = process.env[varName];
  const isSet = !!value;
  const masked = varName.includes('TOKEN') ? (value ? '***' + value.slice(-4) : 'missing') : value;

  console.log(`${varName}: ${isSet ? '✅ ' + masked : '❌ missing'}`);

  if (!isSet) allSet = false;
});

console.log('\n' + '='.repeat(30));

if (allSet) {
  console.log('✅ All Square environment variables are set!');
  console.log('The Square integration should work.');
} else {
  console.log('❌ Some Square environment variables are missing!');
  console.log('Please set them in your .env file:');
  console.log('');
  console.log('SQUARE_INTEGRATION_ENABLED=true');
  console.log('SQUARE_ACCESS_TOKEN=your_sandbox_access_token');
  console.log('SQUARE_LOCATION_ID=your_sandbox_location_id');
  console.log('SQUARE_APPLICATION_ID=your_sandbox_app_id');
  console.log('SQUARE_ENVIRONMENT=sandbox');
  console.log('');
  console.log('Get these values from: https://developer.squareup.com/apps');
}

console.log('\nNote: If you have set these variables, restart your server:');
console.log('npm run dev:all');
