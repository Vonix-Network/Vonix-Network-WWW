import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    minecraftUsername?: string;
    minecraftUuid?: string;
    avatar?: string;
  }

  interface Session {
    user: User & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    minecraftUsername?: string;
    minecraftUuid?: string;
    avatar?: string;
  }
}
