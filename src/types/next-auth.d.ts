import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User extends DefaultUser {
    id: string;
    username?: string;
    role: string;
    minecraftUsername?: string;
    minecraftUuid?: string;
    avatar?: string;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      username?: string;
      role: string;
      minecraftUsername?: string;
      minecraftUuid?: string;
      avatar?: string;
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
    role: string;
    minecraftUsername?: string;
    minecraftUuid?: string;
    avatar?: string;
  }
}
