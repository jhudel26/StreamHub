import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './lib/prisma';
import { CustomPrismaAdapter } from './lib/custom-prisma-adapter';

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          // First try to find a user with matching credentials
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { 
              accounts: {
                where: { 
                  provider: 'credentials',
                  // In a real app, you would verify a hashed password here
                  // For demo purposes, we're just checking if an account exists
                }
              } 
            }
          });

          // If user exists and has at least one credentials account
          if (user && user.accounts.length > 0) {
            // In a real app, you would verify the password hash here
            // For now, we'll just return the user if the account exists
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image
            };
          }
          
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string | null | undefined;
      }
      return session;
    },
    async jwt({ token, user }) {
      const dbUser = await prisma.user.findFirst({
        where: {
          email: token.email,
        },
      });

      if (!dbUser) {
        if (user) {
          token.id = user.id;
        }
        return token;
      }

      // Get user preferences if they exist
      const userPrefs = await prisma.userPreferences.findUnique({
        where: { userId: dbUser.id },
      });

      // Ensure preferences is always a string
      const preferences = userPrefs?.preferences || JSON.stringify({
        categories: [],
        savedVideos: [],
        watchedVideos: []
      });

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        preferences: typeof preferences === 'string' ? preferences : JSON.stringify(preferences)
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
