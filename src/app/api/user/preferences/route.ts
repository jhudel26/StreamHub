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
    
    // Get existing preferences if they exist
    const existingPrefs = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // Parse existing preferences or use defaults
    const currentPrefs = existingPrefs?.preferences 
      ? JSON.parse(existingPrefs.preferences)
      : { categories: [], savedVideos: [], watchedVideos: [] };

    // Update categories
    const updatedPrefs = {
      ...currentPrefs,
      categories: categories || currentPrefs.categories || []
    };

    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: { 
        preferences: JSON.stringify(updatedPrefs)
      },
      create: { 
        userId: session.user.id,
        preferences: JSON.stringify({
          categories: categories || [],
          savedVideos: [],
          watchedVideos: []
        })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
