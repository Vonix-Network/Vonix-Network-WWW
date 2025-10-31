import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { User, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Rate limiting for login attempts
        const ip = request?.headers?.get('x-forwarded-for') || 
                   request?.headers?.get('x-real-ip') || 'unknown';
        const rateLimit = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
        
        if (!rateLimit.allowed) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        try {
          // Find user by username
          const user = await db.query.users.findFirst({
            where: eq(users.username, credentials.username as string),
          });

          if (!user) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id.toString(),
            username: user.username,
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
    signOut: '/',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.minecraftUsername = (user as any).minecraftUsername;
        token.minecraftUuid = (user as any).minecraftUuid;
        token.avatar = (user as any).avatar;
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
        (session.user as any).username = token.username as string | undefined;
        (session.user as any).role = token.role as string;
        (session.user as any).minecraftUsername = token.minecraftUsername as string | undefined;
        (session.user as any).minecraftUuid = token.minecraftUuid as string | undefined;
        (session.user as any).avatar = token.avatar as string | undefined;
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
  },
  secret: process.env.NEXTAUTH_SECRET,
});
