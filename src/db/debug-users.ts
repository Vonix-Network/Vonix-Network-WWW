import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';

export async function debugUsers() {
  try {
    console.log('=== Current Users in Database ===');
    
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        minecraftUsername: users.minecraftUsername,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.id);
    
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}, MC: ${user.minecraftUsername}, Created: ${new Date(user.createdAt).toISOString()}`);
    });
    
    return allUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function findUserByUsername(username: string) {
  try {
    console.log(`=== Looking for user: ${username} ===`);
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (user) {
      console.log('User found:', user);
    } else {
      console.log('User not found');
    }
    
    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
}

// Run this to debug
if (require.main === module) {
  debugUsers().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
