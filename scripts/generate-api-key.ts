import { randomBytes } from 'crypto';

/**
 * Generate a secure API key for the registration endpoints
 * This key should be added to your .env file as REGISTRATION_API_KEY
 */
function generateApiKey(): string {
  // Generate 32 random bytes and convert to base64
  const key = randomBytes(32).toString('base64url');
  return key;
}

// Generate and display the API key
const apiKey = generateApiKey();

console.log('\n' + '='.repeat(80));
console.log('🔑 REGISTRATION API KEY GENERATED');
console.log('='.repeat(80));
console.log('\nAdd this to your .env file:\n');
console.log(`REGISTRATION_API_KEY="${apiKey}"`);
console.log('\n' + '='.repeat(80));
console.log('\n⚠️  IMPORTANT: Keep this key secret and secure!');
console.log('   This key allows access to registration endpoints.\n');
console.log('='.repeat(80) + '\n');
