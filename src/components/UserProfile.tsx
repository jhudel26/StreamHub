'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export function UserProfile() {
  const { data: session } = useSession();
  
  if (!session?.user) return null;

  const userInitials = session.user.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 focus:outline-none">
        <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-medium">
          {userInitials || 'U'}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {session.user.name?.split(' ')[0]}
        </span>
      </button>
      
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
        <Link 
          href="/profile"
          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Profile
        </Link>
        <Link 
          href="/settings"
          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
