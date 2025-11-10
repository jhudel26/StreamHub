'use client';

import { signIn } from 'next-auth/react';
import { Button } from './ui/button';

export function SignInButton() {
  return (
    <Button 
      variant="outline" 
      className="border-teal-500 text-teal-600 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-900/30"
      onClick={() => signIn()}
    >
      Sign In
    </Button>
  );
}
