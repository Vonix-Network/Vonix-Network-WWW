#!/usr/bin/env tsx

console.log('Testing Square package exports...\n');

try {
  const sq = require('square');
  console.log('✅ Square package loaded successfully');
  console.log('Available exports:', Object.keys(sq));
  console.log('\nChecking for Client:');
  console.log('- sq.Client:', !!sq.Client);
  console.log('- sq.SquareClient:', !!sq.SquareClient);
  console.log('\nChecking for Environment:');
  console.log('- sq.Environment:', !!sq.Environment);
  console.log('- sq.SquareEnvironment:', !!sq.SquareEnvironment);

  if (sq.Client) {
    console.log('\n✅ Client found - Square SDK is working');
  } else {
    console.log('\n❌ Client not found - Square SDK issue');
  }
} catch(e: any) {
  console.log('❌ Error loading square package:', e.message);
}
