import 'next-auth';

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
