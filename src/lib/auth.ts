import { NextAuthOptions, getServerSession as getNextAuthServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
// Simple rate limiting without cache dependency
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Rate limiting for login attempts
        const ip = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || 'unknown';
        const rateLimit = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
        
        if (!rateLimit.allowed) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        try {
          // Find user by username
          const user = await db.query.users.findFirst({
            where: eq(users.username, credentials.username),
          });

          if (!user) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id.toString(),
            name: user.username,
            email: user.email || undefined,
            role: user.role,
            minecraftUsername: user.minecraftUsername || undefined,
            minecraftUuid: user.minecraftUuid || undefined,
            avatar: user.avatar || undefined,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.minecraftUsername = user.minecraftUsername;
        token.minecraftUuid = user.minecraftUuid;
        token.avatar = user.avatar;
      }

      // Update session
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.minecraftUsername = token.minecraftUsername as string | undefined;
        session.user.minecraftUuid = token.minecraftUuid as string | undefined;
        session.user.avatar = token.avatar as string | undefined;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      console.log('User signed in:', {
        userId: user.id,
        isNewUser,
      });
    },

    async signOut({ token }) {
      console.log('User signed out:', { userId: token?.id });
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to get session server-side
export async function getServerSession() {
  const { getServerSession: nextGetServerSession } = await import('next-auth/next');
  return nextGetServerSession(authOptions);
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
