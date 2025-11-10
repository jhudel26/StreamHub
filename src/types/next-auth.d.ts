import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    preferences?: string; // Stored as JSON string
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      preferences?: string; // Stored as JSON string
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    preferences?: string; // Stored as JSON string
  }
}
