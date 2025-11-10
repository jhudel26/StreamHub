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
      // If we already have the user ID, just return the token
      if (token.id) {
        return token;
      }

      // If we have a user object (happens on sign in)
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        return token;
      }

      // For subsequent requests, find the user by email
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email },
        include: {
          preferences: true
        }
      });

      if (!dbUser) {
        return token;
      }

      // Get user preferences if they exist
      const preferences = dbUser.preferences?.preferences || JSON.stringify({
        categories: [],
        savedVideos: [],
        watchedVideos: []
      });

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        preferences: preferences
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
