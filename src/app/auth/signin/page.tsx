'use client';

import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">Welcome to StreamHub</h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
          Sign in to access your personalized feed and saved videos
        </p>
        
        <button
          onClick={() => signIn('google')}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 dark:bg-gray-700 dark:text-white px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <FcGoogle className="text-xl" />
          Continue with Google
        </button>
        
        <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
