import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Verify the API key from the request headers against the database
 * @param request - The NextRequest object
 * @returns boolean indicating if the key is valid
 */
export async function verifyApiKey(apiKey: string | null): Promise<boolean> {
  if (!apiKey) {
    return false;
  }

  try {
    // Get the registration API key from database
    const [registrationKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.name, 'registration'))
      .limit(1);

    if (!registrationKey) {
      console.error('Registration API key not found in database');
      return false;
    }

    return apiKey === registrationKey.key;
  } catch (error) {
    console.error('Error verifying API key:', error);
    return false;
  }
}
