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
      // Ensure preferences is a string
      const userData = {
        ...data,
        preferences: typeof data.preferences === 'string' 
          ? data.preferences 
          : JSON.stringify(data.preferences || { categories: [], savedVideos: [], watchedVideos: [] })
      };
      
      const user = await prisma.user.create({
        data: userData,
      });

      return user;
    },
    getUser: adapter.getUser,
    getUserByEmail: adapter.getUserByEmail,
    getUserByAccount: adapter.getUserByAccount,
    updateUser: async (data: UserData & { id: string }) => {
      // Ensure preferences is a string
      const userData = { ...data };
      if ('preferences' in userData) {
        userData.preferences = typeof userData.preferences === 'string' 
          ? userData.preferences 
          : JSON.stringify(userData.preferences);
      }
      
      const user = await prisma.user.update({
        where: { id: data.id },
        data: userData,
      });

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
