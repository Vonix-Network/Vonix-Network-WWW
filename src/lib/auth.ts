// Re-export auth functions from root auth.ts for backward compatibility
export { auth, signIn, signOut } from '../../auth';

// Helper function to get session server-side (v5 compatible)
export async function getServerSession() {
  const { auth } = await import('../../auth');
  return auth();
}

// Helper function to require authentication
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

// Helper function to require admin role
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return session;
}

// Helper function to require moderator or admin role
export async function requireModerator() {
  const session = await requireAuth();
  if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
    throw new Error('Forbidden');
  }
  return session;
}
