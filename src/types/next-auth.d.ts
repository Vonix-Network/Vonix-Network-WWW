import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

export type UserRole = 'user' | 'moderator' | 'admin' | 'superadmin';

declare module 'next-auth' {
  interface User extends DefaultUser {
    id: string;
    username?: string;
    role: UserRole;
    minecraftUsername?: string;
    minecraftUuid?: string;
    avatar?: string;
    donationRankId?: string | null;
    totalDonated?: number;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      username?: string;
      role: UserRole;
      minecraftUsername?: string;
      minecraftUuid?: string;
      avatar?: string;
      donationRankId?: string | null;
      totalDonated?: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    username?: string;
    role: UserRole;
    minecraftUsername?: string;
    minecraftUuid?: string;
    avatar?: string;
    donationRankId?: string | null;
    totalDonated?: number;
  }
}
