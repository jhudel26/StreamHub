import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { Adapter } from 'next-auth/adapters';

// Extend the built-in session types
declare module 'next-auth' {
  interface User {
    id: string;
    preferences?: {
      categories: string[];
      savedVideos: string[];
      watchedVideos: string[];
    };
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      preferences?: {
        categories: string[];
        savedVideos: string[];
        watchedVideos: string[];
      };
    };
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
        const userPrefs = await prisma.userPreferences.findUnique({
          where: { userId: user.id },
        });
        session.user.preferences = (userPrefs?.preferences as any) || {
          categories: [],
          savedVideos: [],
          watchedVideos: []
        };
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await prisma.userPreferences.create({
        data: {
          userId: user.id,
          preferences: {
            categories: [],
            savedVideos: [],
            watchedVideos: [],
          },
        },
      });
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
};
