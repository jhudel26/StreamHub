import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// This prevents this route from being statically generated
export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

// Handle build-time data collection
export async function generateStaticParams() {
  return [];
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { categories } = await req.json();
    
    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: { 
        preferences: { 
          ...session.user.preferences,
          categories: categories || []
        } 
      },
      create: { 
        userId: session.user.id,
        preferences: { 
          categories: categories || [],
          savedVideos: [],
          watchedVideos: []
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
