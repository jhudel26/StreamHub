import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export async function GET() {
  try {
    // Check if API key is configured
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is not configured');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('YOUTUBE') || k.includes('NEXT_PUBLIC')));
      return NextResponse.json(
        { error: 'Server configuration error: YouTube API key is missing' },
        { status: 500 }
      );
    }

    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch popular videos
    const url = `${YOUTUBE_API_URL}/videos?part=snippet,contentDetails,statistics&chart=mostPopular&maxResults=10&regionCode=US&key=${YOUTUBE_API_KEY}`;
    console.log('Fetching from YouTube API:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('YouTube API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error('Failed to fetch from YouTube API');
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in /api/youtube:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube videos' },
      { status: 500 }
    );
  }
}