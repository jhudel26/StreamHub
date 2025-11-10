// src/app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { ReactNode } from 'react';

export function Providers({ 
  children, 
  session 
}: { 
  children: ReactNode; 
  session: any;
}) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster position="top-center" />
      </ThemeProvider>
    </SessionProvider>
  );
}