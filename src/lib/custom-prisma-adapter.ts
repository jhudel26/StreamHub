import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

type UserData = {
  id?: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  preferences?: string | object;
  [key: string]: any;
};

export function CustomPrismaAdapter(p: PrismaClient) {
  const prisma = p;
  const adapter = PrismaAdapter(prisma);

  return {
    ...adapter,
    createUser: async (data: UserData) => {
      // Extract preferences and ensure it's a string
      const { preferences, ...userData } = data;
      const preferencesString = typeof preferences === 'string' 
        ? preferences 
        : JSON.stringify(preferences || { categories: [], savedVideos: [], watchedVideos: [] });
      
      // First create the user
      const user = await prisma.user.create({
        data: userData,
      });

      // Then create the user preferences
      await prisma.userPreferences.create({
        data: {
          userId: user.id,
          preferences: preferencesString
        }
      });

      return user;
    },
    getUser: adapter.getUser,
    getUserByEmail: adapter.getUserByEmail,
    getUserByAccount: adapter.getUserByAccount,
    updateUser: async (data: UserData & { id: string }) => {
      // Extract preferences if it exists
      const { preferences, ...userData } = data;
      
      // Update the user
      const user = await prisma.user.update({
        where: { id: data.id },
        data: userData,
      });

      // Update preferences if they were provided
      if ('preferences' in data) {
        const preferencesString = typeof preferences === 'string' 
          ? preferences 
          : JSON.stringify(preferences);
        
        await prisma.userPreferences.upsert({
          where: { userId: data.id },
          update: { preferences: preferencesString },
          create: { 
            userId: data.id,
            preferences: preferencesString 
          }
        });
      }

      return user;
    },
    deleteUser: adapter.deleteUser,
    linkAccount: adapter.linkAccount,
    unlinkAccount: adapter.unlinkAccount,
    getSessionAndUser: adapter.getSessionAndUser,
    createSession: adapter.createSession,
    updateSession: adapter.updateSession,
    deleteSession: adapter.deleteSession,
    createVerificationToken: adapter.createVerificationToken,
    useVerificationToken: adapter.useVerificationToken,
  };
}
